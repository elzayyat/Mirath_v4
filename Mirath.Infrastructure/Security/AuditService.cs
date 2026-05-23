using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Mirath.Domain.Entities;
using Mirath.Infrastructure.Persistence;

namespace Mirath.Infrastructure.Security;

public interface IAuditService
{
    Task LogAsync(AuditEntry entry);
    Task<IEnumerable<AuditLog>> GetLogsAsync(Guid? userId = null, string? action = null, DateTime? from = null, DateTime? to = null);
}

public record AuditEntry(
    Guid? UserId,
    string Action,
    string EntityType,
    string EntityId,
    object? OldValues,
    object? NewValues,
    string IpAddress,
    string UserAgent,
    bool Success,
    string? ErrorMessage = null);

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditService> _logger;
    
    public AuditService(ApplicationDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    public async Task LogAsync(AuditEntry entry)
    {
        try
        {
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = entry.UserId,
                Action = entry.Action,
                EntityType = entry.EntityType,
                EntityId = entry.EntityId,
                OldValues = entry.OldValues != null ? JsonSerializer.Serialize(entry.OldValues) : null,
                NewValues = entry.NewValues != null ? JsonSerializer.Serialize(entry.NewValues) : null,
                IpAddress = entry.IpAddress,
                UserAgent = entry.UserAgent,
                Success = entry.Success,
                ErrorMessage = entry.ErrorMessage,
                Timestamp = DateTime.UtcNow
            };
            
            await _context.AuditLogs.AddAsync(auditLog);
            await _context.SaveChangesAsync();
            
            _logger.LogDebug("Audit log created: {Action} by {UserId}", entry.Action, entry.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create audit log");
        }
    }
    
    public async Task<IEnumerable<AuditLog>> GetLogsAsync(Guid? userId = null, string? action = null, DateTime? from = null, DateTime? to = null)
    {
        var query = _context.AuditLogs.AsQueryable();
        
        if (userId.HasValue)
            query = query.Where(l => l.UserId == userId);
        
        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action == action);
        
        if (from.HasValue)
            query = query.Where(l => l.Timestamp >= from);
        
        if (to.HasValue)
            query = query.Where(l => l.Timestamp <= to);
        
        return await query.OrderByDescending(l => l.Timestamp).ToListAsync();
    }
}