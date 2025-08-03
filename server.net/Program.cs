using Server;
using Server.Models;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

builder.AddAuthenticationServer();

var configSection = builder.Configuration.GetSection("FileServerConfig");
builder.Services.Configure<LibPathConfig>(configSection);
builder.Services.AddTransient<ConfigService>();
builder.Services.AddTransient<FolderService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseRouting();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();
//app.MapFallbackToPage("/FileServer");

app.Run();
