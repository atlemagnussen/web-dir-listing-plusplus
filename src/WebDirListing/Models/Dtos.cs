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
}

public record Listing
{
    public required string Title { get; init; }
    public required string Path { get; init; }
    public required List<Entry> Entries { get; init; }
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

public record UserInfo(string Sub, string? Name);

public record AppInfo(string Title, UserInfo User);
