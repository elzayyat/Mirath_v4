using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;
using Mirath.Infrastructure.Security;

namespace Mirath.API.Controllers.v1;

[Authorize(Roles = "Admin")]
public class AdminController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    public AdminController(ApplicationDbContext db, IPasswordHasher hasher) { _db = db; _hasher = hasher; }

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> Users([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var q = _db.Users.AsNoTracking().Where(x => !x.IsDeleted).OrderByDescending(x => x.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).Select(u => new AdminUserDto(u.Id, u.Email, u.NameEnglish, u.NameArabic, u.Phone, u.Role, u.IsActive, u.CreatedAt)).ToListAsync(ct);
        return Ok(new PagedResult<AdminUserDto>(items, page, pageSize, total));
    }

    [HttpPost("users")]
    public async Task<ActionResult<AdminUserDto>> CreateUser(AdminCreateUserRequest r, CancellationToken ct)
    {
        var email = r.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(x => x.Email == email, ct)) return BadRequest("Email exists");
        var u = new User { Email = email, PasswordHash = _hasher.HashPassword(r.Password), Role = r.Role, NameEnglish = r.NameEnglish, NameArabic = r.NameArabic ?? string.Empty, Phone = r.Phone ?? string.Empty, IsActive = r.IsActive, Status = r.IsActive ? AccountStatus.Active : AccountStatus.Deactivated, IsEmailVerified = true };
        _db.Users.Add(u); await _db.SaveChangesAsync(ct);
        return Created($"/api/admin/users/{u.Id}", new AdminUserDto(u.Id, u.Email, u.NameEnglish, u.NameArabic, u.Phone, u.Role, u.IsActive, u.CreatedAt));
    }

    [HttpPut("users/{id:guid}")]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(Guid id, AdminUpdateUserRequest r, CancellationToken ct)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (u == null) return NotFound("User not found");
        if (u.IsSystemProtected && r.Role.HasValue && r.Role != UserRole.Admin) return BadRequest("Protected admin cannot be demoted");
        u.NameEnglish = r.NameEnglish ?? u.NameEnglish; u.NameArabic = r.NameArabic ?? u.NameArabic; u.Phone = r.Phone ?? u.Phone; u.Role = r.Role ?? u.Role; u.IsActive = r.IsActive ?? u.IsActive; u.Status = u.IsActive ? AccountStatus.Active : AccountStatus.Deactivated; u.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(r.Password)) u.PasswordHash = _hasher.HashPassword(r.Password);
        await _db.SaveChangesAsync(ct);
        return Ok(new AdminUserDto(u.Id, u.Email, u.NameEnglish, u.NameArabic, u.Phone, u.Role, u.IsActive, u.CreatedAt));
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (u == null) return NotFound("User not found");
        if (u.IsSystemProtected) return BadRequest("Protected admin cannot be deleted");
        u.IsDeleted = true; u.IsActive = false; u.Status = AccountStatus.Deactivated; await _db.SaveChangesAsync(ct); return StatusCode(StatusCodes.Status200OK, new { message = "User deleted" });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> Stats(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        return Ok(new AdminStatsDto(await _db.Cases.CountAsync(x => !x.IsDeleted, ct), await _db.Users.CountAsync(x => !x.IsDeleted, ct), await _db.InheritanceResults.CountAsync(x => x.CalculatedAt >= today, ct), 0m));
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<List<AuditLog>>> AuditLogs(CancellationToken ct) => Ok(await _db.AuditLogs.AsNoTracking().OrderByDescending(x => x.Timestamp).Take(500).ToListAsync(ct));
}

public record AdminUserDto(Guid Id, string Email, string NameEnglish, string NameArabic, string Phone, UserRole Role, bool IsActive, DateTime CreatedAt);
public record AdminCreateUserRequest(string Email, string Password, string NameEnglish, string? NameArabic, string? Phone, UserRole Role, bool IsActive = true);
public record AdminUpdateUserRequest(string? Password, string? NameEnglish, string? NameArabic, string? Phone, UserRole? Role, bool? IsActive);
public record AdminStatsDto(int TotalCases, int TotalUsers, int CalculationsToday, decimal Revenue);
