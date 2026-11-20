using WebDirListing.Models;

namespace WebDirListing.Services;

/// <summary>
/// Turns per-file progress rows into "books":
/// <list type="bullet">
/// <item>an .epub file is a book,</item>
/// <item>a single-file audiobook format (.m4b) is an audiobook on its own,</item>
/// <item>any other audio files are grouped per folder: one folder = one audiobook (chapters as files).</item>
/// </list>
/// </summary>
public class TrackerService(LibraryService lib, ProgressStore store)
{
    public static bool IsBook(string path) => path.EndsWith(".epub", StringComparison.OrdinalIgnoreCase);

    /// <summary>Audio formats that hold a whole book in one file.</summary>
    public static bool IsSingleFileAudiobook(string path) => path.EndsWith(".m4b", StringComparison.OrdinalIgnoreCase);

    private bool IsAudio(string path) => lib.GetMimeType(path).StartsWith("audio/");

    /// <summary>Audio files that are grouped as one folder audiobook.</summary>
    private bool IsChapterFile(Entry e) => e.Type == EntryType.File && IsAudio(e.Name) && !IsSingleFileAudiobook(e.Name);

    public Tracker GetTracker(string sub)
    {
        var rows = store.GetAll(sub);
        var items = new List<TrackedItem>();

        foreach (var row in rows.Where(r => IsBook(r.Path) || IsSingleFileAudiobook(r.Path)))
        {
            if (lib.Resolve(row.Path) is { } r && File.Exists(r.FullPath))
                items.Add(FromFile(row));
        }

        var chapterRows = rows.Where(r => !IsBook(r.Path) && !IsSingleFileAudiobook(r.Path) && IsAudio(r.Path));
        foreach (var group in chapterRows.GroupBy(r => ProgressStore.FolderOf(r.Path)))
        {
            if (FolderItem(group.Key, group.ToList()) is { } item)
                items.Add(item);
        }

        var ordered = items.OrderByDescending(i => i.UpdatedAt).ToList();
        return new Tracker(
            [.. ordered.Where(i => !i.Finished)],
            [.. ordered.Where(i => i.Finished)]);
    }

    /// <summary>Adds folder aggregates to a listing: to the listing itself and to its sub-folders.</summary>
    public void Annotate(string sub, Listing listing)
    {
        var progress = store.GetForFolder(sub, listing.Path);
        foreach (var entry in listing.Entries)
            entry.Progress = progress.GetValueOrDefault(entry.Path);

        var chapterRows = progress.Values.Where(p => !IsBook(p.Path) && !IsSingleFileAudiobook(p.Path)).ToList();
        if (chapterRows.Count > 0)
            listing.Tracked = FolderItem(listing, chapterRows);

        var below = store.GetBelow(sub, listing.Path)
            .Where(p => !IsBook(p.Path) && !IsSingleFileAudiobook(p.Path))
            .GroupBy(p => ProgressStore.FolderOf(p.Path))
            .ToDictionary(g => g.Key, g => g.ToList());
        foreach (var folder in listing.Entries.Where(e => e.Type == EntryType.Folder))
        {
            if (below.TryGetValue(folder.Path, out var rows))
                folder.Tracked = FolderItem(folder.Path, rows);
        }
    }

    /// <summary>Paths the "mark finished" action applies to: the file itself, or a folder's chapter files.</summary>
    public IEnumerable<string>? MediaPathsFor(string virtualPath)
    {
        var resolved = lib.Resolve(virtualPath);
        if (resolved is null)
            return null;
        if (File.Exists(resolved.FullPath))
            return [resolved.VirtualPath];
        var listing = lib.List(resolved.VirtualPath);
        return listing?.Entries.Where(IsChapterFile).Select(e => e.Path).ToList();
    }

    private static TrackedItem FromFile(Progress row) => new()
    {
        Kind = IsBook(row.Path) ? TrackedKind.Book : TrackedKind.Audiobook,
        Path = row.Path,
        Title = Path.GetFileNameWithoutExtension(row.Path),
        Folder = ProgressStore.FolderOf(row.Path),
        Fraction = row.Finished ? 1 : row.Fraction ?? 0,
        Finished = row.Finished,
        CurrentPath = row.Path,
        Position = row.Position,
        Duration = row.Duration,
        Locator = row.Locator,
        FinishedFiles = row.Finished ? 1 : 0,
        UpdatedAt = row.UpdatedAt,
    };

    private TrackedItem? FolderItem(string folder, List<Progress> rows)
    {
        var listing = lib.List(folder);
        return listing is null ? null : FolderItem(listing, rows);
    }

    private TrackedItem? FolderItem(Listing listing, List<Progress> rows)
    {
        var files = listing.Entries.Where(IsChapterFile).ToList();
        if (files.Count == 0)
            return null;

        var byPath = rows.ToDictionary(r => r.Path, StringComparer.Ordinal);
        var total = files.Sum(f => (double)Math.Max(f.Size, 1));
        var done = 0.0;
        var finishedFiles = 0;
        foreach (var f in files)
        {
            if (!byPath.TryGetValue(f.Path, out var p))
                continue;
            if (p.Finished)
            {
                finishedFiles++;
                done += Math.Max(f.Size, 1);
            }
            else
                done += (p.Fraction ?? 0) * Math.Max(f.Size, 1);
        }

        // Continue with the most recently played file, or the one after it if that one is finished.
        var latest = rows.Where(r => byPath.ContainsKey(r.Path) && files.Any(f => f.Path == r.Path))
            .MaxBy(r => r.UpdatedAt);
        Progress? current = null;
        string? currentPath = null;
        if (latest is not null)
        {
            if (!latest.Finished)
            {
                current = latest;
                currentPath = latest.Path;
            }
            else
            {
                var i = files.FindIndex(f => f.Path == latest.Path);
                var next = files.Skip(i + 1).FirstOrDefault(f => !(byPath.GetValueOrDefault(f.Path)?.Finished ?? false));
                currentPath = next?.Path;
                current = next is null ? null : byPath.GetValueOrDefault(next.Path);
            }
        }
        currentPath ??= files.FirstOrDefault(f => !(byPath.GetValueOrDefault(f.Path)?.Finished ?? false))?.Path;

        var finished = finishedFiles == files.Count;
        return new TrackedItem
        {
            Kind = TrackedKind.Audiobook,
            Path = listing.Path,
            Title = listing.Title,
            Folder = ProgressStore.FolderOf(listing.Path),
            Fraction = finished ? 1 : Math.Clamp(done / total, 0, 1),
            Finished = finished,
            CurrentPath = finished ? null : currentPath,
            Position = current?.Position,
            Duration = current?.Duration,
            Files = files.Count,
            FinishedFiles = finishedFiles,
            UpdatedAt = rows.Max(r => r.UpdatedAt),
        };
    }
}
