using Microsoft.Extensions.Options;
using Server.Models;

namespace Server.Services;

public class ConfigService
{
    private readonly LibPathConfig _config;
    
    public ConfigService(IOptions<LibPathConfig> options)
    {
        _config = options.Value;
    }

    public LibPathConfig GetLibPaths()
    {
        //var libPaths = new LibPathConfig();
        //var configSection = _config.GetSection("FileServerConfig");
        //configSection.Bind(libPaths);
        return _config;
    }
}