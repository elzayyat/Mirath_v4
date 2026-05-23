using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Application.Services;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;

namespace Mirath.API.Controllers.v1;

[Authorize]
public class CalculationController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    private readonly IFarayidCalculationService _farayid;

    public CalculationController(ApplicationDbContext db, IFarayidCalculationService farayid)
    {
        _db = db;
        _farayid = farayid;
    }

    [HttpPost("/api/cases/{id:guid}/calculate")]
    [HttpPost("/api/v1/cases/{id:guid}/calculate")]
    public async Task<ActionResult<FarayidCalculationResponse>> Calculate(Guid id, FarayidCalculationRequest request, CancellationToken ct)
    {
        var c = await _db.Cases.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");

        var response = await _farayid.CalculateAsync(id, request, ct);
        return Ok(response, "Inheritance calculated");
    }

    private bool CanAccess(Mirath.Domain.Entities.Case c)
        => CurrentUserRole == UserRole.Admin.ToString()
           || c.LawyerId == CurrentUserId
           || c.ClientId == CurrentUserId
           || c.UserId == CurrentUserId;
}
