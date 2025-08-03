using Microsoft.AspNetCore.Mvc.RazorPages;
using Server.Models;
using Server.Services;

namespace Server.Pages;

public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;
    private readonly ConfigService _service;

    public IndexModel(ILogger<IndexModel> logger, ConfigService service)
    {
        _logger = logger;
        _service = service;
    }

    public LibPathConfig? LibPathConfig { get; set; }
    public void OnGet()
    {
        var libPaths = _service.GetLibPaths();
        LibPathConfig = libPaths;
    }
}
