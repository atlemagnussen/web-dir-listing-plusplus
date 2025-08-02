namespace Server.Models;

public record FolderContent
{
    public required string Path { get; init; }
    public List<FileOrDir> Entries { get; set; } = [];
}