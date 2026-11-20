namespace Server.Models;

public enum FileEntryType
{
    File, Folder, Root, Unknown
}

public record FileOrDir
{
    public required FileEntryType Type { get; init; }
    public required string Name { get; init; }
    public string? Ext { get; init; }
    public string? MimeType { get; init; }
    public long Size { get; init; }
    public string Path { get; init; } = string.Empty;
    public string? FolderPath { get; init; }
}