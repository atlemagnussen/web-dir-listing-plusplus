using Server.Models;

namespace Server.Services;

public class ConfigService
{
    private readonly IConfiguration _config;
    public ConfigService(IConfiguration config)
    {
        _config = config;
    }

    public LibPathConfig GetLibPaths()
    {
        var libPaths = new LibPathConfig();
        var configSection = _config.GetSection("FileServerConfig");
        configSection.Bind(libPaths);
        return libPaths;
    }
}