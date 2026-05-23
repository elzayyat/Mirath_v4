using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;

namespace Mirath.API.Controllers.v1;

[Authorize]
public partial class CasesController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    public CasesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<CaseSummaryDto>>> GetCases([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] CaseStatus? status = null, [FromQuery] Guid? lawyerId = null, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, CancellationToken ct = default)
    {
        var q = AuthorizedCases().AsNoTracking();
        if (status.HasValue) q = q.Where(x => x.Status == status.Value);
        if (lawyerId.HasValue) q = q.Where(x => x.LawyerId == lawyerId.Value);
        if (fromDate.HasValue) q = q.Where(x => x.CreatedAt >= fromDate.Value.ToUniversalTime());
        if (toDate.HasValue) q = q.Where(x => x.CreatedAt <= toDate.Value.ToUniversalTime());
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).Select(x => MapSummary(x)).ToListAsync(ct);
        return Ok(new PagedResult<CaseSummaryDto>(items, page, pageSize, total));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CaseSummaryDto>> CreateCase(CreateCaseRequest r, CancellationToken ct)
    {
        var c = new Case { CaseNumber = string.IsNullOrWhiteSpace(r.CaseNumber) ? $"MIR-{DateTime.UtcNow:yyyyMMddHHmmss}" : r.CaseNumber, Title = r.Title, LawyerId = r.LawyerId ?? CurrentUserId, ClientId = r.ClientId, UserId = CurrentUserId, Status = r.Status, Notes = r.Notes, Description = r.Notes, CreatedAt = DateTime.UtcNow };
        if (r.Decedent != null) c.Decedent = new Decedent { Name = r.Decedent.Name, DeathDate = r.Decedent.DeathDate, Religion = r.Decedent.Religion, MaritalStatus = r.Decedent.MaritalStatus, Notes = r.Decedent.Notes };
        _db.Cases.Add(c);
        await _db.SaveChangesAsync(ct);
        return Created($"/api/cases/{c.Id}", MapSummary(c), "Case created");
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CaseFullDto>> GetCase(Guid id, CancellationToken ct)
    {
        var c = await FullCaseQuery().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");
        return Ok(MapFull(c));
    }

    [HttpGet("{id:guid}/full")]
    public Task<ActionResult<CaseFullDto>> GetFull(Guid id, CancellationToken ct) => GetCase(id, ct);

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CaseSummaryDto>> UpdateCase(Guid id, UpdateCaseRequest r, CancellationToken ct)
    {
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");
        c.Title = r.Title ?? c.Title; c.CaseNumber = r.CaseNumber ?? c.CaseNumber; c.Status = r.Status ?? c.Status; c.LawyerId = r.LawyerId ?? c.LawyerId; c.ClientId = r.ClientId ?? c.ClientId; c.Notes = r.Notes ?? c.Notes; c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(MapSummary(c), "Case updated");
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCase(Guid id, CancellationToken ct)
    {
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");
        c.IsDeleted = true; c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return StatusCode(StatusCodes.Status200OK, new { message = "Case deleted" });
    }

    private IQueryable<Case> AuthorizedCases()
    {
        var q = _db.Cases.Where(x => !x.IsDeleted);
        if (CurrentUserRole == UserRole.Admin.ToString()) return q;
        return q.Where(x => x.LawyerId == CurrentUserId || x.ClientId == CurrentUserId || x.UserId == CurrentUserId);
    }
    private IQueryable<Case> FullCaseQuery() => _db.Cases.Include(x => x.Decedent).Include(x => x.Assets).Include(x => x.Heirs).Include(x => x.InheritanceResults).Include(x => x.Documents);
    private bool CanAccess(Case c) => CurrentUserRole == UserRole.Admin.ToString() || c.LawyerId == CurrentUserId || c.ClientId == CurrentUserId || c.UserId == CurrentUserId;
    internal static CaseSummaryDto MapSummary(Case x) => new(x.Id, x.CaseNumber, x.Title, x.LawyerId, x.ClientId, x.Status, x.CreatedAt, x.UpdatedAt, x.Notes);
    internal static CaseFullDto MapFull(Case x) => new(MapSummary(x), x.Decedent, x.Assets.ToList(), x.Heirs.ToList(), x.InheritanceResults.OrderByDescending(r => r.CalculatedAt).ToList(), x.Documents.ToList());
}

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);
public record CaseSummaryDto(Guid Id, string CaseNumber, string Title, Guid? LawyerId, Guid? ClientId, CaseStatus Status, DateTime CreatedAt, DateTime? UpdatedAt, string? Notes);
public record CaseFullDto(CaseSummaryDto Case, Decedent? Decedent, IReadOnlyList<Asset> Assets, IReadOnlyList<Heir> Heirs, IReadOnlyList<InheritanceResult> Results, IReadOnlyList<Document> Documents);
public record CreateCaseRequest(string Title, string? CaseNumber, Guid? LawyerId, Guid? ClientId, CaseStatus Status, string? Notes, DecedentRequest? Decedent);
public record UpdateCaseRequest(string? Title, string? CaseNumber, Guid? LawyerId, Guid? ClientId, CaseStatus? Status, string? Notes);
public record DecedentRequest(string Name, DateTime DeathDate, Religion Religion, MaritalStatus MaritalStatus, string? Notes);
