namespace Server.Models;

public record LibPathConfig
{
    public string Title { get; init; } = "Title";

    public Dictionary<string, string>? Paths { get; init; }
}