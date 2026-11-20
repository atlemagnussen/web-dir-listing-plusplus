namespace WebDirListing.Models;

public enum EntryType { Root, Folder, File }

public record Entry
{
    public required EntryType Type { get; init; }
    public required string Name { get; init; }
    /// <summary>Virtual path, e.g. "/Audio/Some book/01.mp3". Always starts with "/".</summary>
    public required string Path { get; init; }
    public string? Ext { get; init; }
    public string? MimeType { get; init; }
    public long Size { get; init; }
    public DateTimeOffset? Modified { get; init; }
    public Progress? Progress { get; set; }
    /// <summary>For folders that are (partly) listened audiobooks: aggregated progress.</summary>
    public TrackedItem? Tracked { get; set; }
}

public record Listing
{
    public required string Title { get; init; }
    public required string Path { get; init; }
    public required List<Entry> Entries { get; init; }
    /// <summary>Aggregated audiobook progress for this folder, if any of its audio files has progress.</summary>
    public TrackedItem? Tracked { get; set; }
}

public record Progress
{
    public required string Path { get; init; }
    /// <summary>Seconds into an audio file.</summary>
    public double? Position { get; init; }
    /// <summary>Total seconds of an audio file, as reported by the client.</summary>
    public double? Duration { get; init; }
    /// <summary>Opaque position for non-audio media, e.g. an EPUB CFI.</summary>
    public string? Locator { get; init; }
    /// <summary>0..1</summary>
    public double? Fraction { get; init; }
    public bool Finished { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}

public record ProgressUpdate(
    string Path,
    double? Position,
    double? Duration,
    string? Locator,
    double? Fraction,
    bool? Finished);

public record FinishedUpdate(string Path, bool Finished);

public record ResetRequest(string Path);

public enum TrackedKind { Audiobook, Book }

/// <summary>
/// Something a user listens to or reads, as shown in the tracker:
/// an EPUB file, a single-file audiobook (m4b), or a folder of audio files (one book, many chapters).
/// </summary>
public record TrackedItem
{
    public required TrackedKind Kind { get; init; }
    /// <summary>Virtual path of the folder (multi-file audiobook) or the file.</summary>
    public required string Path { get; init; }
    public required string Title { get; init; }
    /// <summary>Virtual path of the folder containing <see cref="Path"/>.</summary>
    public required string Folder { get; init; }
    /// <summary>0..1. For folders weighted by file size, which tracks duration well at a constant bitrate.</summary>
    public double Fraction { get; init; }
    public bool Finished { get; init; }
    /// <summary>File to continue with.</summary>
    public string? CurrentPath { get; init; }
    public double? Position { get; init; }
    public double? Duration { get; init; }
    public string? Locator { get; init; }
    public int Files { get; init; } = 1;
    public int FinishedFiles { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}

public record Tracker(List<TrackedItem> InProgress, List<TrackedItem> Finished);

public record UserInfo(string Sub, string? Name);

public record AppInfo(string Title, UserInfo User);
