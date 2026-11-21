namespace WebDirListing.Models;

/// <summary>Section "Library" in configuration.</summary>
public class LibraryOptions
{
    public string Title { get; set; } = "Web dir listing";

    /// <summary>Display name (first URL segment) -> absolute folder path.</summary>
    public Dictionary<string, string> Paths { get; set; } = [];

    /// <summary>Writable folder for the SQLite database. Must not be inside a read-only media mount.</summary>
    public string StateDir { get; set; } = "state";
}

/// <summary>Section "Oidc" in configuration.</summary>
public class OidcOptions
{
    /// <summary>Issuer URL of the OpenID Connect provider. Required unless DevBypass is on.</summary>
    public string Authority { get; set; } = "";
    public string ClientId { get; set; } = "web";
    public string? ClientSecret { get; set; }
    public string[] Scopes { get; set; } = ["openid", "profile", "file"];

    /// <summary>
    /// Development only: skip OIDC and sign everyone in as a fixed fake user.
    /// Ignored unless ASPNETCORE_ENVIRONMENT=Development.
    /// </summary>
    public bool DevBypass { get; set; }
}
