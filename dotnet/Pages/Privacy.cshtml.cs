using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Server.Pages;

[Authorize]
public class PrivacyModel : PageModel
{
    private readonly ILogger<PrivacyModel> _logger;

    public PrivacyModel(ILogger<PrivacyModel> logger)
    {
        _logger = logger;
    }

    public Dictionary<string, string> Claims = [];

    public string Issuer { get; set; } = string.Empty;
    public void OnGet()
    {
        if (User.Identity is not null && User.Identity.IsAuthenticated)
        {
            var scopes = User.Claims.ToArray();
            var firstClaim = scopes.First();

            Issuer = firstClaim.Issuer;

            foreach (var scope in scopes)
            {
                Claims.Add(scope.Type, scope.Value);
            }
        }
    }
}

