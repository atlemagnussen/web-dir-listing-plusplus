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

    public FolderContent GetFolderContent(string path)
    {
        var content = new FolderContent
        {
            Path = path
        };
        if (string.IsNullOrWhiteSpace(path))
            return content;

        var routeConfig = FileService.ParsePath(_config, path);

        var entries = Directory.GetFileSystemEntries(routeConfig.PhysicalPath);
        if (entries is null)
            return content;

        var arrEntries = entries.Select(c => new FileOrDir
        {
            Type = FileService.GetEntryType(c),
            Name = c.Replace(routeConfig.PhysicalPath, "").TrimStart('/')
        })
        .Where(e => e.Type.Equals(FileEntryType.File) ||
               e.Type.Equals(FileEntryType.Folder))
        .ToList();

        content.Entries = arrEntries;

        return content;
    }
}