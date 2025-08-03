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
    private readonly ILogger<FileServerModel> _logger;

    public FileServerModel(FolderService service, IOptions<LibPathConfig> options, ILogger<FileServerModel> logger)
    {
        _service = service;
        _config = options.Value;
        _logger = logger;
    }

    public FolderContent? FolderContent { get; set; }
    public string? Path { get; set; }

    public IActionResult OnGet()
    {
        foreach (var rv in RouteData.Values)
        {
            _logger.LogInformation($"FileServer:Get:: {rv.Key}:{rv.Value}");
        }
        try
            {
                var route = FileService.Parse(_config, RouteData.Values);

                Path = route.Path;

                if (route.Root is null || route.Root == "/")
                {
                    FolderContent = new FolderContent
                    {
                        PhysicalPath = "",
                        Path = "/"
                    };

                    if (_config.Paths is not null)
                    {
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
                    return OnGetFile(route);
                }

                return Page();
            }
            catch (Exception)
            {
                return NotFound();
            }
    }

    public FileResult OnGetFile(RouteConfig file)
    {
        var mimeType = FileService.GetMimeType(file.PhysicalPath);
        byte[] fileBytes = System.IO.File.ReadAllBytes(file.PhysicalPath);

        //var fileName = Path.GetFileName(file.PhysicalPath);
        return File(fileBytes, mimeType); // append filename to make download link
    }
}