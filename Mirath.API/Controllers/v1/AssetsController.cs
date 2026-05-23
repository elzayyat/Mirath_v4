using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;

namespace Mirath.API.Controllers.v1;

[Authorize]
public class AssetsController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    public AssetsController(ApplicationDbContext db) => _db = db;

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Asset>> Update(Guid id, AssetRequest r, CancellationToken ct)
    {
        var a = await _db.Assets.Include(x => x.Case).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (a == null || !CanAccess(a.Case)) return NotFound("Asset not found");
        a.Type = r.Type; a.Description = r.Description; a.Value = r.Value; a.Currency = r.Currency; a.Weight = r.Weight; a.Unit = r.Unit; a.ValuationDate = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct); return Ok(a, "Asset updated");
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var a = await _db.Assets.Include(x => x.Case).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (a == null || !CanAccess(a.Case)) return NotFound("Asset not found");
        _db.Assets.Remove(a); await _db.SaveChangesAsync(ct); return StatusCode(StatusCodes.Status200OK, new { message = "Asset deleted" });
    }

    private bool CanAccess(Case c) => CurrentUserRole == UserRole.Admin.ToString() || c.LawyerId == CurrentUserId || c.ClientId == CurrentUserId || c.UserId == CurrentUserId;
}

public partial class CasesController
{
    [HttpPost("{id:guid}/assets")]
    public async Task<ActionResult<Asset>> AddAsset(Guid id, AssetRequest r, CancellationToken ct)
    {
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");
        var a = new Asset { CaseId = id, Type = r.Type, Description = r.Description, Value = r.Value, Currency = r.Currency, Weight = r.Weight, Unit = r.Unit };
        _db.Assets.Add(a); await _db.SaveChangesAsync(ct); return Ok(a, "Asset added");
    }
}

public record AssetRequest(AssetType Type, string Description, decimal Value, string Currency, decimal? Weight, string? Unit);
