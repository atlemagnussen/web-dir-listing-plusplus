namespace Server.Models;

public record RouteConfig
{
    public string? Route { get; set; }
    public string? Root { get; set; }
    public string Path { get
        {
            if (string.IsNullOrWhiteSpace(Root))
                return "";
            
            if (string.IsNullOrWhiteSpace(Route))
                return Root;

            return $"{Root}{Route}"; 
        }
    }
    public bool IsFolder { get; set; }
    public string PhysicalPath { get; set; } = string.Empty;
}