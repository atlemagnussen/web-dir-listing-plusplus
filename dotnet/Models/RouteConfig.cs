namespace Server.Models;

public record RouteConfig
{
    public required string Route { get; set; }
    public required string Root { get; set; }
    public bool IsFolder { get; set; }
    public string PhysicalPath { get; set; } = string.Empty;
}