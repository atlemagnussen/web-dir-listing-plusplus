namespace Server.Models;

public record RouteConfig
{
    public required string Route { get; set; }
    public required string Root { get; set; }
    public string Folder { get; set; } = string.Empty;
}