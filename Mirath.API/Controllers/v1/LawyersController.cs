using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;

namespace Mirath.API.Controllers.v1;

[Authorize(Roles = "Lawyer,Admin")]
public class LawyersController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    public LawyersController(ApplicationDbContext db) => _db = db;

    [HttpGet("my-cases")]
    public async Task<ActionResult<List<CaseSummaryDto>>> MyCases(CancellationToken ct)
    {
        var cases = await _db.Cases.AsNoTracking().Where(x => !x.IsDeleted && (CurrentUserRole == "Admin" || x.LawyerId == CurrentUserId || x.UserId == CurrentUserId)).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).ToListAsync(ct);
        return Ok(cases.Select(CasesController.MapSummary).ToList());
    }

    [HttpGet("my-clients")]
    public async Task<ActionResult<List<User>>> MyClients(CancellationToken ct)
    {
        var ids = await _db.Cases.AsNoTracking().Where(x => CurrentUserRole == "Admin" || x.LawyerId == CurrentUserId).Where(x => x.ClientId.HasValue).Select(x => x.ClientId!.Value).Distinct().ToListAsync(ct);
        return Ok(await _db.Users.AsNoTracking().Where(x => ids.Contains(x.Id)).ToListAsync(ct));
    }

    [HttpPost("invite-client")]
    public async Task<IActionResult> InviteClient(InviteClientRequest r, CancellationToken ct)
    {
        _db.Notifications.Add(new Notification { UserId = CurrentUserId, Message = $"Client invitation queued for {r.Email}", Link = r.ReturnUrl, CreatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync(ct);
        return StatusCode(StatusCodes.Status200OK, new { message = "Invitation queued. Configure SMTP provider to send email." });
    }
}
public record InviteClientRequest(string Email, string? Name, string? ReturnUrl);
