using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using WebDirListing.Models;

namespace WebDirListing.Services;

/// <summary>A virtual path resolved to a location on disk, guaranteed to be inside its library root.</summary>
public record ResolvedPath(string Root, string RootDir, string FullPath, string VirtualPath)
{
    public bool IsRoot => FullPath == RootDir;
}

/// <summary>
/// Maps virtual paths ("/Audio/Book/01.mp3") to the configured library folders and reads them.
/// Every filesystem access must go through <see cref="Resolve"/> so paths cannot escape a root.
/// </summary>
public class LibraryService
{
    private readonly LibraryOptions _options;
    private readonly Dictionary<string, string> _roots;
    private readonly FileExtensionContentTypeProvider _mime = new();

    public LibraryService(IOptions<LibraryOptions> options)
    {
        _options = options.Value;
        _roots = _options.Paths.ToDictionary(
            p => p.Key,
            p => Path.TrimEndingDirectorySeparator(Path.GetFullPath(p.Value)),
            StringComparer.Ordinal);

        // Types the default provider lacks or gets wrong for browser playback.
        _mime.Mappings[".m4b"] = "audio/mp4";
        _mime.Mappings[".m4a"] = "audio/mp4";
        _mime.Mappings[".opus"] = "audio/ogg";
        _mime.Mappings[".flac"] = "audio/flac";
        _mime.Mappings[".epub"] = "application/epub+zip";
        _mime.Mappings[".mkv"] = "video/x-matroska";
    }

    public string Title => _options.Title;

    public IEnumerable<string> RootNames => _roots.Keys;

    /// <summary>Returns null if the path is unknown or would escape its root.</summary>
    public ResolvedPath? Resolve(string? virtualPath)
    {
        var segments = (virtualPath ?? "")
            .Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (segments.Length == 0)
            return null;
        // Rejects "." / ".." and hidden entries (e.g. a ".webdirlisting" state folder inside a library).
        if (segments.Any(s => s.StartsWith('.')))
            return null;

        if (!_roots.TryGetValue(segments[0], out var rootDir))
            return null;

        var rest = string.Join(Path.DirectorySeparatorChar, segments.Skip(1));
        var full = Path.TrimEndingDirectorySeparator(Path.GetFullPath(Path.Join(rootDir, rest)));

        var inside = full == rootDir ||
            full.StartsWith(rootDir + Path.DirectorySeparatorChar, StringComparison.Ordinal);
        if (!inside)
            return null;

        return new ResolvedPath(segments[0], rootDir, full, "/" + string.Join('/', segments));
    }

    public Listing ListRoots() => new()
    {
        Title = Title,
        Path = "/",
        Entries = [.. _roots.Keys.Select(name => new Entry
        {
            Type = EntryType.Root,
            Name = name,
            Path = "/" + name,
        })],
    };

    /// <summary>Returns null if the path does not resolve to an existing folder.</summary>
    public Listing? List(string? virtualPath)
    {
        var resolved = Resolve(virtualPath);
        if (resolved is null || !Directory.Exists(resolved.FullPath))
            return null;

        var dir = new DirectoryInfo(resolved.FullPath);
        var entries = dir
            .EnumerateFileSystemInfos("*", new EnumerationOptions { IgnoreInaccessible = true })
            .Where(fsi => !fsi.Name.StartsWith('.'))
            .Select(fsi => ToEntry(fsi, resolved.VirtualPath + "/" + fsi.Name))
            .OrderBy(e => e.Type == EntryType.Folder ? 0 : 1)
            .ThenBy(e => e.Name, NaturalStringComparer.Instance)
            .ToList();

        return new Listing
        {
            Title = resolved.IsRoot ? resolved.Root : dir.Name,
            Path = resolved.VirtualPath,
            Entries = entries,
        };
    }

    public IEnumerable<Entry> Search(string term, int max = 200)
    {
        term = term.Trim();
        if (term.Length < 2)
            return [];

        var options = new EnumerationOptions
        {
            RecurseSubdirectories = true,
            IgnoreInaccessible = true,
            MatchCasing = MatchCasing.CaseInsensitive,
            AttributesToSkip = FileAttributes.Hidden | FileAttributes.System,
        };
        // Strip wildcard characters so the term is matched literally.
        var pattern = "*" + term.Replace("*", "").Replace("?", "") + "*";

        return _roots
            .SelectMany(root => new DirectoryInfo(root.Value)
                .EnumerateFileSystemInfos(pattern, options)
                .Select(fsi => ToEntry(fsi,
                    "/" + root.Key + "/" + Path.GetRelativePath(root.Value, fsi.FullName)
                        .Replace(Path.DirectorySeparatorChar, '/'))))
            .Take(max)
            .ToList();
    }

    public string GetMimeType(string fileName) =>
        _mime.TryGetContentType(fileName, out var type) ? type : "application/octet-stream";

    private Entry ToEntry(FileSystemInfo fsi, string virtualPath)
    {
        if (fsi is DirectoryInfo)
            return new Entry
            {
                Type = EntryType.Folder,
                Name = fsi.Name,
                Path = virtualPath,
                Modified = fsi.LastWriteTimeUtc,
            };

        var file = (FileInfo)fsi;
        return new Entry
        {
            Type = EntryType.File,
            Name = file.Name,
            Path = virtualPath,
            Ext = file.Extension.TrimStart('.').ToLowerInvariant(),
            MimeType = GetMimeType(file.Name),
            Size = file.Length,
            Modified = file.LastWriteTimeUtc,
        };
    }
}
