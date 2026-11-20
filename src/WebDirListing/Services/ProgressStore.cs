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

    public List<Progress> GetAll(string sub)
    {
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT {Columns} FROM progress WHERE sub = $sub ORDER BY updated_at DESC";
        cmd.Parameters.AddWithValue("$sub", sub);
        return ReadAll(cmd);
    }

    /// <summary>Rows in any folder below <paramref name="folder"/> (not the folder itself).</summary>
    public List<Progress> GetBelow(string sub, string folder)
    {
        var prefix = folder.TrimEnd('/') + "/";
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        // substr instead of LIKE: paths may contain % and _.
        cmd.CommandText = $"""
            SELECT {Columns} FROM progress
            WHERE sub = $sub AND substr(folder, 1, length($prefix)) = $prefix
            """;
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$prefix", prefix);
        return ReadAll(cmd);
    }

    /// <summary>
    /// Sets/clears the finished flag, keeping position and fraction (readers treat finished as 100%),
    /// so "mark as not finished" goes back to where you were. Creates the row if needed.
    /// </summary>
    public void SetFinished(string sub, IEnumerable<string> paths, bool finished)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        using var cmd = conn.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = """
            INSERT INTO progress (sub, path, folder, finished, updated_at)
            VALUES ($sub, $path, $folder, $finished, $updated)
            ON CONFLICT (sub, path) DO UPDATE SET
                finished   = excluded.finished,
                updated_at = excluded.updated_at
            """;
        var pPath = cmd.Parameters.Add("$path", SqliteType.Text);
        var pFolder = cmd.Parameters.Add("$folder", SqliteType.Text);
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$finished", finished ? 1 : 0);
        cmd.Parameters.AddWithValue("$updated", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        foreach (var path in paths)
        {
            pPath.Value = path;
            pFolder.Value = FolderOf(path);
            cmd.ExecuteNonQuery();
        }
        tx.Commit();
    }

    public int DeleteFolder(string sub, string folder)
    {
        using var conn = Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM progress WHERE sub = $sub AND folder = $folder";
        cmd.Parameters.AddWithValue("$sub", sub);
        cmd.Parameters.AddWithValue("$folder", folder);
        return cmd.ExecuteNonQuery();
    }

    private static List<Progress> ReadAll(SqliteCommand cmd)
    {
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
