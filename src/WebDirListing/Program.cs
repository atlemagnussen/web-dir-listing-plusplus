using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration.Json;
using WebDirListing.Auth;
using WebDirListing.Endpoints;
using WebDirListing.Models;
using WebDirListing.Services;

var builder = WebApplication.CreateBuilder(args);

// Gitignored per-machine config (library paths, DevBypass) for local testing.
// Inserted right after appsettings.{Environment}.json so environment variables still win.
var sources = builder.Configuration.Sources;
var afterJson = sources.ToList().FindLastIndex(s => s is JsonConfigurationSource) + 1;
sources.Insert(afterJson, new JsonConfigurationSource
{
    Path = "appsettings.Local.json",
    Optional = true,
    ReloadOnChange = true,
});

builder.Services.Configure<LibraryOptions>(builder.Configuration.GetSection("Library"));

// Cookie encryption keys live next to the database, so logins survive container restarts/updates.
var stateDir = Path.GetFullPath(
    builder.Configuration["Library:StateDir"] ?? "state", builder.Environment.ContentRootPath);
builder.Services.AddDataProtection()
    .SetApplicationName("WebDirListing")
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(stateDir, "keys")));
builder.Services.AddSingleton<LibraryService>();
builder.Services.AddSingleton<ProgressStore>();
builder.Services.AddSingleton<TrackerService>();

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(
        System.Text.Json.JsonNamingPolicy.CamelCase));
    o.SerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// Runs behind a TLS-terminating reverse proxy on the NAS: trust X-Forwarded-* so the
// OIDC redirect_uri is built with https and the public host name.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

builder.AddAppAuthentication();

var app = builder.Build();

app.UseForwardedHeaders();

// EPUB content is untrusted HTML rendered in same-origin iframes (foliate-js needs
// allow-same-origin + allow-scripts). The CSP is what stops scripts inside a book, or inside an
// .html file opened from a library, from running as the logged-in user: only our own bundled
// scripts may run. Blob iframes inherit this policy from the page that creates them.
const string contentSecurityPolicy =
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline' blob:; " +
    "img-src 'self' blob: data:; " +
    "font-src 'self' blob: data:; " +
    "media-src 'self' blob:; " +
    // Web Awesome fetches its Font Awesome icons from this CDN.
    "connect-src 'self' blob: data: https://ka-f.fontawesome.com; " +
    "frame-src 'self' blob: data:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'self'";
app.Use((ctx, next) =>
{
    ctx.Response.Headers.ContentSecurityPolicy = contentSecurityPolicy;
    ctx.Response.Headers.XContentTypeOptions = "nosniff";
    return next();
});

if (!app.Environment.IsDevelopment())
    app.UseExceptionHandler(e => e.Run(ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
        return Task.CompletedTask;
    }));

// The OIDC callback (/signin-oidc) is handled inside UseAuthentication.
app.UseAuthentication();

// Nothing is public: not even the client's js/css. Unauthenticated requests are challenged
// (OIDC redirect for pages/assets, 401 for /api, see AuthSetup) before static files are served.
// /auth/* handles login, logout and the error page itself.
app.Use(async (ctx, next) =>
{
    if (ctx.User.Identity?.IsAuthenticated == true || ctx.Request.Path.StartsWithSegments("/auth"))
        await next();
    else
        await ctx.ChallengeAsync();
});

app.UseStaticFiles();
// Explicit, after static files: otherwise routing runs first and the catch-all SPA fallback
// below claims every request, and UseStaticFiles skips requests that already have an endpoint.
app.UseRouting();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapApiEndpoints();

// Client-side routes: "/Audio/Some book", and also "/Books/Some book.epub" (the reader). The
// default fallback pattern skips paths that look like files, so match everything explicitly;
// real static files are served by UseStaticFiles before routing gets here.
app.MapFallbackToFile("{*path}", "index.html");

app.Run();
