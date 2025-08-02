using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Server.Models;
using Server.Services;

namespace Server.Pages;

[Authorize]
public class FileServerModel : PageModel
{
    private readonly FolderService _service;

    public FileServerModel(FolderService service)
    {
        _service = service;
    }

    public FileOrDir[] FolderContent { get; set; } = [];
    public string? Route { get; set; }

    public void OnGet()
    {

        var pagePath = RouteData.Values["path"]?.ToString();
        Route = pagePath;

        if (pagePath is not null)
        {
            FolderContent = _service.GetFolderContent(pagePath);
        }

    }
}