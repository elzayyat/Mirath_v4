namespace Mirath.Infrastructure.Security;

public static class SecurityHeadersExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        app.Use(async (context, next) =>
        {
            if (context.Request.IsHttps)
            {
                context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
            }

            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()";
            context.Response.Headers["Content-Security-Policy"] = BuildCspPolicy();

            if (IsSensitiveEndpoint(context.Request.Path))
            {
                context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
                context.Response.Headers["Pragma"] = "no-cache";
            }

            await next();
        });

        return app;
    }

    private static string BuildCspPolicy()
    {
        var policies = new List<string>
        {
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://code.jquery.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://api.openai.com wss:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        };

        return string.Join("; ", policies);
    }

    private static bool IsSensitiveEndpoint(PathString path)
    {
        var sensitivePaths = new[] { "/api/v1/auth", "/api/v1/cases" };
        return sensitivePaths.Any(p => path.ToString().StartsWith(p, StringComparison.OrdinalIgnoreCase));
    }
}
