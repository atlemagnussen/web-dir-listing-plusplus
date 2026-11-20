using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using WebDirListing.Models;

namespace WebDirListing.Services;

/// <summary>Per-user listening/reading position, stored in SQLite and keyed by OIDC "sub" + virtual path.</summary>
public class ProgressStore
{
    private readonly string _connectionString;

    public ProgressStore(IOptions<LibraryOptions> options, IHostEnvironment env, ILogger<ProgressStore> logger)
    {
        var stateDir = Path.GetFullPath(options.Value.StateDir, env.ContentRootPath);
        Directory.CreateDirectory(stateDir);
        var dbPath = Path.Combine(stateDir, "webdirlisting.db");
        logger.LogInformation("Progress database: {DbPath}", dbPath);

        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = dbPath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
        }.ToString();

        Migrate();
    }

    private SqliteConnection Open()
    {
        var conn = new SqliteConnection(_connectionString);
        conn.Open();
        return conn;
    }

    private void Migrate()
    {
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS progress (
                sub        TEXT    NOT NULL,
                path       TEXT    NOT NULL,
                folder     TEXT    NOT NULL,
                position   REAL,
                duration   REAL,
                locator    TEXT,
                fraction   REAL,
                finished   INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (sub, path)
            );
            CREATE INDEX IF NOT EXISTS ix_progress_sub_folder  ON progress (sub, folder);
            CREATE INDEX IF NOT EXISTS ix_progress_sub_updated ON progress (sub, updated_at DESC);
            """;
        cmd.ExecuteNonQuery();
    }

    public Progress Upsert(string sub, string path, ProgressUpdate update)
    {
        var now = DateTimeOffset.UtcNow;
        var fraction = update.Fraction;
        if (fraction is null && update.Position is { } pos && update.Duration is > 0)
            fraction = Math.Clamp(pos / update.Duration.Value, 0, 1);

        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO progress (sub, path, folder, position, duration, locator, fraction, finished, updated_at)
            VALUES ($sub, $path, $folder, $position, $duration, $locator, $fraction, $finished, $updated)
            ON CONFLICT (sub, path) DO UPDATE SET
                position   = excluded.position,
                duration   = COALESCE(excluded.duration, progress.duration),
                locator    = excluded.locator,
                fraction   = excluded.fraction,
                finished   = excluded.finished,
                updated_at = excluded.updated_at
            RETURNING path, position, duration, locator, fraction, finished, updated_at;
            """;
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$path", path);
        cmd.Parameters.AddWithValue("$folder", FolderOf(path));
        cmd.Parameters.AddWithValue("$position", (object?)update.Position ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$duration", (object?)update.Duration ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$locator", (object?)update.Locator ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$fraction", (object?)fraction ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$finished", update.Finished == true ? 1 : 0);
        cmd.Parameters.AddWithValue("$updated", now.ToUnixTimeMilliseconds());

        using var reader = cmd.ExecuteReader();
        reader.Read();
        return Read(reader);
    }

    public Progress? Get(string sub, string path)
    {
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT {Columns} FROM progress WHERE sub = $sub AND path = $path";
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$path", path);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? Read(reader) : null;
    }

    /// <summary>All progress rows for files directly inside a folder.</summary>
    public Dictionary<string, Progress> GetForFolder(string sub, string folder)
    {
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT {Columns} FROM progress WHERE sub = $sub AND folder = $folder";
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$folder", folder);
        using var reader = cmd.ExecuteReader();
        var result = new Dictionary<string, Progress>(StringComparer.Ordinal);
        while (reader.Read())
        {
            var p = Read(reader);
            result[p.Path] = p;
        }
        return result;
    }

    /// <summary>Most recently touched, unfinished item per folder ("continue listening/reading").</summary>
    public List<Progress> GetRecent(string sub, int limit)
    {
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"""
            SELECT {Columns} FROM (
                SELECT *, ROW_NUMBER() OVER (PARTITION BY folder ORDER BY updated_at DESC) AS rn
                FROM progress WHERE sub = $sub
            )
            WHERE rn = 1 AND finished = 0
            ORDER BY updated_at DESC
            LIMIT $limit
            """;
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$limit", limit);
        using var reader = cmd.ExecuteReader();
        var result = new List<Progress>();
        while (reader.Read())
            result.Add(Read(reader));
        return result;
    }

    public bool Delete(string sub, string path)
    {
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM progress WHERE sub = $sub AND path = $path";
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$path", path);
        return cmd.ExecuteNonQuery() > 0;
    }

    private const string Columns = "path, position, duration, locator, fraction, finished, updated_at";

    private static Progress Read(SqliteDataReader r) => new()
    {
        Path = r.GetString(0),
        Position = r.IsDBNull(1) ? null : r.GetDouble(1),
        Duration = r.IsDBNull(2) ? null : r.GetDouble(2),
        Locator = r.IsDBNull(3) ? null : r.GetString(3),
        Fraction = r.IsDBNull(4) ? null : r.GetDouble(4),
        Finished = r.GetInt64(5) != 0,
        UpdatedAt = DateTimeOffset.FromUnixTimeMilliseconds(r.GetInt64(6)),
    };

    public static string FolderOf(string virtualPath)
    {
        var i = virtualPath.LastIndexOf('/');
        return i <= 0 ? "/" : virtualPath[..i];
    }
}
