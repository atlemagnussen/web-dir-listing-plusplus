using Microsoft.AspNetCore.StaticFiles;
using Server.Models;

namespace Server.Services;

public static class FileService
{
    public static RouteConfig ParsePath(LibPathConfig config, string path)
    {
        var route = new RouteConfig
        {
            Root = "",
            Route = path,
        };

        if (path.Contains('/'))
        {
            var array = path.Split('/');
            string[] cleanedArray = [.. array.Where(s => !string.IsNullOrEmpty(s))];

            route.Root = cleanedArray[0];

            var restArray = cleanedArray.Skip(1).ToArray();

            var restPath = string.Join('/', restArray);

            var rootFolder = GetRootFolder(config, route.Root);

            var physicalPath = Path.Join(rootFolder, restPath);
            route.PhysicalPath = physicalPath;
        }
        else
        {
            route.Root = path;
            var rootFolder = GetRootFolder(config, route.Root);
            route.PhysicalPath = rootFolder;
        }

        route.IsFolder = Directory.Exists(route.PhysicalPath);

        return route;
    }

    public static FileEntryType GetEntryType(string path)
    {
        if (File.Exists(path))
            return FileEntryType.File;

        if (Directory.Exists(path))
            return FileEntryType.Folder;

        return FileEntryType.Unknown;
    }

    public static string GetMimeType(string fileName)
    {
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(fileName, out string? contentType))
        {
            // Fallback to a default MIME type if not found
            contentType = "application/octet-stream"; 
        }
        return contentType;
    }
    
    private static string GetRootFolder(LibPathConfig config, string root)
    {
        if (config.Paths is null)
            throw new ApplicationException("No configured paths");

        var rootFolder = config.Paths[root];

        if (string.IsNullOrWhiteSpace(rootFolder))
            throw new ApplicationException($"Cant find root folder by {root}");

        return rootFolder;
    }
}