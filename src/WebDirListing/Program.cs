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

// Built client assets (js/css/icons) are public; index.html is served by the
// authenticated fallback below, so opening the app triggers the login redirect.
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapApiEndpoints();

// Client-side routes: "/Audio/Some book" etc.
app.MapFallbackToFile("index.html");

app.Run();
