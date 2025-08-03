using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Options;
using Server.Models;
using Server.Services;

namespace Server.Pages;

[Authorize]
public class FileServerModel : PageModel
{
    private readonly FolderService _service;
    private readonly LibPathConfig _config;

    public FileServerModel(FolderService service, IOptions<LibPathConfig> options)
    {
        _service = service;
        _config = options.Value;
    }

    public FolderContent? FolderContent { get; set; }
    public string? Route { get; set; }

    public IActionResult OnGet()
    {
        var route = FileService.Parse(_config, RouteData.Values);
        
        if (route.Root is null || route.Root == "/")
        {
            FolderContent = new FolderContent
            {
                PhysicalPath = "",
                Path = "/"
            };

            if (_config.Paths is not null) {
                foreach (var root in _config.Paths)
                    FolderContent.Entries.Add(new FileOrDir
                    {
                        Name = root.Key,
                        Type = FileEntryType.Folder
                    });
            }
            return Page();
        }


        if (route.IsFolder)
        {
            FolderContent = _service.GetFolderContent(route.PhysicalPath);
            FolderContent.Path = route.Path;
        }
        else
        {
            return OnGetDownloadFile(route);
        }
    
        return Page();
    }

    public FileResult OnGetDownloadFile(RouteConfig file)
    {
        if (file.IsFolder)
            throw new ApplicationException("is folder");

        var mimeType = FileService.GetMimeType(file.PhysicalPath);
        byte[] fileBytes = System.IO.File.ReadAllBytes(file.PhysicalPath);

        var fileName = Path.GetFileName(file.PhysicalPath);

        return File(fileBytes, mimeType, fileName);
    }
}