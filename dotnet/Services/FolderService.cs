using System.IO.Compression;
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

    public FolderContent GetFolderContent(string physicalPath)
    {
        var content = new FolderContent
        {
            PhysicalPath = physicalPath,
            Path = ""
        };
        if (string.IsNullOrWhiteSpace(physicalPath))
            return content;


        var entries = Directory.GetFileSystemEntries(physicalPath);
        if (entries is null)
            return content;

        var arrEntries = entries.Select(c => new FileOrDir
        {
            Type = FileService.GetEntryType(c),
            Name = c.Replace(physicalPath, "").TrimStart('/')
        })
        .Where(e => e.Type.Equals(FileEntryType.File) ||
               e.Type.Equals(FileEntryType.Folder))
        .OrderBy(e => e.Name)
        .ToList();

        content.Entries = arrEntries;

        return content;
    }
}