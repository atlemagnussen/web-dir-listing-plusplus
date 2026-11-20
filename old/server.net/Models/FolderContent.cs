namespace Server.Models;

public record FolderContent
{
    public required string PhysicalPath { get; init; }
    public required string Path { get; set; }
    public List<FileOrDir> Entries { get; set; } = [];
}