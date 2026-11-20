using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using WebDirListing.Models;

namespace WebDirListing.Auth;

public static class AuthSetup
{
    public const string DevScheme = "Dev";

    /// <summary>
    /// Server-side OIDC code flow with a cookie session. Because the browser holds a cookie,
    /// plain &lt;audio src&gt; and download links are authenticated too, so no route has to be public.
    /// Every endpoint requires an authenticated user unless marked AllowAnonymous.
    /// </summary>
    public static void AddAppAuthentication(this WebApplicationBuilder builder)
    {
        var oidc = builder.Configuration.GetSection("Oidc").Get<OidcOptions>() ?? new OidcOptions();
        var devBypass = oidc.DevBypass && builder.Environment.IsDevelopment();

        builder.Services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        if (devBypass)
        {
            builder.Services.AddAuthentication(DevScheme)
                .AddScheme<AuthenticationSchemeOptions, DevAuthHandler>(DevScheme, null);
            return;
        }

        builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
            })
            .AddCookie(options =>
            {
                options.Cookie.Name = "wdl.auth";
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.ExpireTimeSpan = TimeSpan.FromDays(30);
                options.SlidingExpiration = true;
            })
            .AddOpenIdConnect(options =>
            {
                options.Authority = oidc.Authority;
                options.ClientId = oidc.ClientId;
                options.ClientSecret = oidc.ClientSecret;
                options.ResponseType = "code";
                options.UsePkce = true;
                // Redirect (GET) back to /signin-oidc instead of a cross-site form POST: the reverse
                // proxy's bot protection uses a SameSite=Lax cookie, which browsers don't send on
                // cross-site POSTs, so a form_post callback would be challenged and lost.
                options.ResponseMode = "query";
                // id.logout.work advertises PAR but rejects it for the public "web" client
                // (400 + HTML). Plain authorization-code redirect with PKCE works.
                options.PushedAuthorizationBehavior = PushedAuthorizationBehavior.Disable;
                options.SaveTokens = true; // id_token is needed as hint for sign-out
                options.GetClaimsFromUserInfoEndpoint = true;
                options.MapInboundClaims = false;
                options.Scope.Clear();
                foreach (var scope in oidc.Scopes)
                    options.Scope.Add(scope);
                options.TokenValidationParameters.NameClaimType = "name";
                options.TokenValidationParameters.RoleClaimType = "role";

                options.Events.OnRedirectToIdentityProvider = context =>
                {
                    // API calls get a 401 instead of a redirect; the client then does a full-page login.
                    if (context.Request.Path.StartsWithSegments("/api"))
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.HandleResponse();
                    }
                    return Task.CompletedTask;
                };
                options.Events.OnRemoteFailure = context =>
                {
                    context.Response.Redirect("/auth/error?message=" +
                        Uri.EscapeDataString(context.Failure?.Message ?? "unknown"));
                    context.HandleResponse();
                    return Task.CompletedTask;
                };
            });
    }

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/auth");

        group.MapGet("/login", (string? returnUrl) =>
            Results.Challenge(new AuthenticationProperties { RedirectUri = SafeLocal(returnUrl) }));

        group.MapGet("/logout", async (IAuthenticationSchemeProvider schemes) =>
        {
            if (await schemes.GetSchemeAsync(OpenIdConnectDefaults.AuthenticationScheme) is null)
                return Results.Redirect("/"); // dev bypass: nothing to sign out of
            return Results.SignOut(new AuthenticationProperties { RedirectUri = "/" },
                [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]);
        });

        // Shows how the app sees the request after forwarded headers are applied, i.e. which
        // redirect_uri it will send to the IdP. Useful when setting up the reverse proxy.
        group.MapGet("/debug", (HttpContext ctx) => new
        {
            redirectUri = $"{ctx.Request.Scheme}://{ctx.Request.Host}{ctx.Request.PathBase}/signin-oidc",
            scheme = ctx.Request.Scheme,
            host = ctx.Request.Host.Value,
            remoteIp = ctx.Connection.RemoteIpAddress?.ToString(),
            authenticated = ctx.User.Identity?.IsAuthenticated == true,
        }).AllowAnonymous();

        group.MapGet("/error", (string? message) =>
            Results.Content($"""
                <!doctype html><meta charset="utf-8"><title>Login failed</title>
                <h1>Login failed</h1><p>{HtmlEncoder.Default.Encode(message ?? "")}</p>
                <p><a href="/auth/login">Try again</a></p>
                """, "text/html"))
            .AllowAnonymous();
    }

    private static string SafeLocal(string? url) =>
        !string.IsNullOrEmpty(url) && url.StartsWith('/') && !url.StartsWith("//") ? url : "/";

    public static string? GetSub(this ClaimsPrincipal user) => user.FindFirstValue("sub");
}

/// <summary>Development-only handler: everyone is "dev-user".</summary>
public class DevAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var identity = new ClaimsIdentity(
            [new Claim("sub", "dev-user"), new Claim("name", "Dev User")],
            AuthSetup.DevScheme, "name", "role");
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), AuthSetup.DevScheme);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
