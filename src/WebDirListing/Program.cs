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
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapApiEndpoints();

// Client-side routes: "/Audio/Some book" etc.
app.MapFallbackToFile("index.html");

app.Run();
