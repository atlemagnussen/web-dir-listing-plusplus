namespace Server;

public static class Config
{
    public static void AddAuthenticationServer(this WebApplicationBuilder builder)
    {
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultScheme = "Cookies"; // The default authentication scheme for interactive users
            options.DefaultChallengeScheme = "oidc"; // The scheme used to challenge unauthenticated users
        })
        .AddCookie("Cookies", options =>
        {
            // Configure cookie options if needed (e.g., cookie name, expiration)
        })
        .AddOpenIdConnect("oidc", options =>
        {
            options.Authority = "https://id.atle.guru";
            options.ClientId = "web";
            options.ResponseType = "code";
            options.SaveTokens = true;
            options.GetClaimsFromUserInfoEndpoint = true;

            options.Scope.Add("openid");
            options.Scope.Add("profile");
            // options.Scope.Add("your_api_scope");

            // Map claims if necessary (e.g., to transform Duende claims into ASP.NET Core Identity claims)
            options.MapInboundClaims = false; // Prevents Microsoft from changing claim types

            options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                NameClaimType = "name", // Or "sub" if you prefer
                RoleClaimType = "role" // Or your custom role claim type
            };

            // Optional: Events for customizing the OIDC flow
            options.Events.OnRemoteFailure = context =>
            {
                // Handle remote authentication failures (e.g., redirect to an error page)
                context.Response.Redirect("/Error?message=" + context.Failure?.Message);
                context.HandleResponse();
                return Task.CompletedTask;
            };
        });
    }
}