using Microsoft.Extensions.Options;
using Server.Models;

namespace Server.Services;

public class FolderService
{
    private readonly LibPathConfig _config;

    public FolderService(IOptions<LibPathConfig> options)
    {
        _config = options.Value;
    }

    public FileOrDir[] GetFolderContent(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return [];

        var routeConfig = ParseRoute(path);

        var content = Directory.GetFileSystemEntries(routeConfig.Folder);
        if (content is null)
            return [];


        var arr = content.Select(c => new FileOrDir
        {
            Type = FileEntryType.File,
            Name = c
        }).ToArray();

        return arr;
    }

    private RouteConfig ParseRoute(string path)
    {
        var config = new RouteConfig
        {
            Root = "",
            Route = path,
        };

        if (path.Contains('/'))
        {
            var array = path.Split('/');
            string[] cleanedArray = [.. array.Where(s => !string.IsNullOrEmpty(s))];

            config.Root = cleanedArray[0];

            var restArray = cleanedArray.Skip(1).ToArray();

            var restPath = string.Join('/', restArray);

            var rootFolder = GetRootFolder(config.Root);

            var physicalPath = Path.Join(rootFolder, restPath);
            config.Folder = physicalPath;
        }
        else
        {
            config.Root = path;
            var rootFolder = GetRootFolder(config.Root);
            config.Folder = rootFolder;
        }


        return config;
    }

    private string GetRootFolder(string root)
    {
        if (_config.Paths is null)
            throw new ApplicationException("No configured paths");

        var rootFolder = _config.Paths[root];

        if (string.IsNullOrWhiteSpace(rootFolder))
            throw new ApplicationException($"Cant find root folder by {root}");

        return rootFolder;
    }
}