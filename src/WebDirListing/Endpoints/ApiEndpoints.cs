using System.IO.Compression;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.Features;
using WebDirListing.Auth;
using WebDirListing.Models;
using WebDirListing.Services;

namespace WebDirListing.Endpoints;

public static class ApiEndpoints
{
    public static void MapApiEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api");

        api.MapGet("/me", (ClaimsPrincipal user, LibraryService lib) =>
            new AppInfo(lib.Title, new UserInfo(user.GetSub() ?? "", user.Identity?.Name)));

        // Folder listing. "/api/list" or "/api/list/" lists the configured libraries.
        api.MapGet("/list/{**path}", (string? path, ClaimsPrincipal user, LibraryService lib, ProgressStore store) =>
        {
            if (string.IsNullOrWhiteSpace(path))
                return Results.Ok(lib.ListRoots());

            var listing = lib.List(path);
            if (listing is null)
                return Results.NotFound();

            var progress = store.GetForFolder(user.GetSub()!, listing.Path);
            foreach (var entry in listing.Entries)
                entry.Progress = progress.GetValueOrDefault(entry.Path);
            return Results.Ok(listing);
        });

        // File content with HTTP Range support (seeking in <audio>, resumable downloads).
        api.MapGet("/file/{**path}", (string path, bool? download, LibraryService lib) =>
        {
            var resolved = lib.Resolve(path);
            if (resolved is null || !File.Exists(resolved.FullPath))
                return Results.NotFound();

            var name = Path.GetFileName(resolved.FullPath);
            return Results.File(resolved.FullPath, lib.GetMimeType(name),
                fileDownloadName: download == true ? name : null,
                enableRangeProcessing: true);
        });

        // Folder (recursively) as a zip, streamed without buffering the whole archive.
        api.MapGet("/zip/{**path}", async (string path, HttpContext ctx, LibraryService lib) =>
        {
            var resolved = lib.Resolve(path);
            if (resolved is null || !Directory.Exists(resolved.FullPath))
            {
                ctx.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            var folderName = Path.GetFileName(resolved.FullPath);
            ctx.Response.ContentType = "application/zip";
            ctx.Response.Headers.ContentDisposition =
                new System.Net.Mime.ContentDisposition { FileName = folderName + ".zip" }.ToString();

            // ZipArchive writes synchronously; allow it for this response only.
            ctx.Features.Get<IHttpBodyControlFeature>()!.AllowSynchronousIO = true;

            using var zip = new ZipArchive(ctx.Response.Body, ZipArchiveMode.Create, leaveOpen: true);
            var files = Directory.EnumerateFiles(resolved.FullPath, "*",
                new EnumerationOptions
                {
                    RecurseSubdirectories = true,
                    IgnoreInaccessible = true,
                    // Dotfiles/dot-folders are Hidden on Unix in .NET: keep state dirs out of zips.
                    AttributesToSkip = FileAttributes.Hidden | FileAttributes.System,
                });
            foreach (var file in files)
            {
                ctx.RequestAborted.ThrowIfCancellationRequested();
                var entryName = Path.Combine(folderName, Path.GetRelativePath(resolved.FullPath, file))
                    .Replace(Path.DirectorySeparatorChar, '/');
                // Media is already compressed; storing is much faster on a NAS CPU.
                var entry = zip.CreateEntry(entryName, CompressionLevel.NoCompression);
                entry.LastWriteTime = File.GetLastWriteTime(file);
                await using var source = File.OpenRead(file);
                await using var target = entry.Open();
                await source.CopyToAsync(target, ctx.RequestAborted);
            }
        });

        api.MapGet("/search", (string q, LibraryService lib) => lib.Search(q));

        var progress = api.MapGroup("/progress");

        progress.MapGet("/", (string path, ClaimsPrincipal user, LibraryService lib, ProgressStore store) =>
        {
            var resolved = lib.Resolve(path);
            if (resolved is null)
                return Results.NotFound();
            var p = store.Get(user.GetSub()!, resolved.VirtualPath);
            return p is null ? Results.NoContent() : Results.Ok(p);
        });

        progress.MapGet("/recent", (int? limit, ClaimsPrincipal user, ProgressStore store) =>
            store.GetRecent(user.GetSub()!, Math.Clamp(limit ?? 20, 1, 100)));

        progress.MapPut("/", (ProgressUpdate update, ClaimsPrincipal user, LibraryService lib, ProgressStore store) =>
        {
            var resolved = lib.Resolve(update.Path);
            if (resolved is null || !File.Exists(resolved.FullPath))
                return Results.NotFound();
            return Results.Ok(store.Upsert(user.GetSub()!, resolved.VirtualPath, update));
        });

        progress.MapDelete("/", (string path, ClaimsPrincipal user, LibraryService lib, ProgressStore store) =>
        {
            var resolved = lib.Resolve(path);
            if (resolved is null)
                return Results.NotFound();
            store.Delete(user.GetSub()!, resolved.VirtualPath);
            return Results.NoContent();
        });

        // Unknown /api routes must not fall through to the SPA.
        api.MapFallback(() => Results.NotFound());
    }
}
