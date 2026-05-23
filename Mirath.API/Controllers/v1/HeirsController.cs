using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;
using Mirath.Shared.Enums;

namespace Mirath.API.Controllers.v1;

[Authorize]
public class HeirsController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    public HeirsController(ApplicationDbContext db) => _db = db;

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Heir>> Update(Guid id, HeirRequest r, CancellationToken ct)
    {
        var h = await _db.Heirs.Include(x => x.Case).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (h == null || !CanAccess(h.Case)) return NotFound("Heir not found");
        h.Name = r.Name; h.Relationship = r.Relationship; h.IsAlive = r.IsAlive; h.HasChildren = r.HasChildren; h.Gender = r.Gender; h.Count = Math.Max(1, r.Count ?? 1);
        await _db.SaveChangesAsync(ct); return Ok(h, "Heir updated");
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var h = await _db.Heirs.Include(x => x.Case).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (h == null || !CanAccess(h.Case)) return NotFound("Heir not found");
        _db.Heirs.Remove(h); await _db.SaveChangesAsync(ct); return StatusCode(StatusCodes.Status200OK, new { message = "Heir deleted" });
    }
    private bool CanAccess(Case c) => CurrentUserRole == UserRole.Admin.ToString() || c.LawyerId == CurrentUserId || c.ClientId == CurrentUserId || c.UserId == CurrentUserId;
}

public partial class CasesController
{
    [HttpPost("{id:guid}/heirs")]
    public async Task<ActionResult<Heir>> AddHeir(Guid id, HeirRequest r, CancellationToken ct)
    {
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");
        var h = new Heir { CaseId = id, Name = r.Name, Relationship = r.Relationship, IsAlive = r.IsAlive, HasChildren = r.HasChildren, Gender = r.Gender, Count = Math.Max(1, r.Count ?? 1) };
        _db.Heirs.Add(h); await _db.SaveChangesAsync(ct); return Ok(h, "Heir added");
    }
}

public record HeirRequest(string Name, HeirType Relationship, bool IsAlive, bool HasChildren, Gender Gender, int? Count);
