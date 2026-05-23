using System.Security.Claims;
using Mirath.Domain.Entities;
using Mirath.Infrastructure.Persistence;

namespace Mirath.API.Middleware;

public sealed class SensitiveOperationAuditMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly string[] SensitiveMarkers = { "/api/admin/users", "/api/admin/audit-logs", "/api/cases", "/calculate", "/documents" };
    public SensitiveOperationAuditMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext db)
    {
        await _next(context);
        if (!IsSensitive(context)) return;
        var idClaim = context.User.FindFirstValue("userId") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(idClaim, out var userId);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId == Guid.Empty ? null : userId,
            Action = $"{context.Request.Method} {context.Request.Path}",
            EntityType = InferEntityType(context.Request.Path),
            EntityId = null,
            Timestamp = DateTime.UtcNow,
            Details = $"Status={context.Response.StatusCode}; IP={context.Connection.RemoteIpAddress}"
        });
        await db.SaveChangesAsync(context.RequestAborted);
    }

    private static bool IsSensitive(HttpContext context)
    {
        if (context.Response.StatusCode >= 400) return false;
        var path = context.Request.Path.Value ?? string.Empty;
        if (context.Request.Method == HttpMethods.Get && !path.Contains("documents", StringComparison.OrdinalIgnoreCase)) return false;
        return SensitiveMarkers.Any(m => path.Contains(m, StringComparison.OrdinalIgnoreCase));
    }

    private static string InferEntityType(PathString path)
    {
        var p = path.Value ?? string.Empty;
        if (p.Contains("documents", StringComparison.OrdinalIgnoreCase)) return "Document";
        if (p.Contains("calculate", StringComparison.OrdinalIgnoreCase)) return "InheritanceCalculation";
        if (p.Contains("admin/users", StringComparison.OrdinalIgnoreCase)) return "User";
        if (p.Contains("cases", StringComparison.OrdinalIgnoreCase)) return "Case";
        return "System";
    }
}
