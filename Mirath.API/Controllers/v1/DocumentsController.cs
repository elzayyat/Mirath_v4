using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;

namespace Mirath.API.Controllers.v1;

[Authorize]
public class DocumentsController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;
    public DocumentsController(ApplicationDbContext db, IWebHostEnvironment env) { _db = db; _env = env; }

    [HttpPost("/api/cases/{caseId:guid}/documents")]
    [HttpPost("/api/v1/cases/{caseId:guid}/documents")]
    [RequestSizeLimit(20_000_000)]
    public async Task<ActionResult<Document>> Upload(Guid caseId, IFormFile file, [FromForm] string type = "General", CancellationToken ct = default)
    {
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == caseId, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");
        if (file.Length == 0) return BadRequest("File is empty");
        if (file.Length > 20_000_000) return BadRequest("Maximum upload size is 20MB.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".pdf", ".jpg", ".jpeg", ".png" };
        if (!allowed.Contains(extension)) return BadRequest("Only PDF, JPG, and PNG files are allowed.");
        var originalName = Path.GetFileName(file.FileName);
        if (originalName != file.FileName || originalName.Contains("..")) return BadRequest("Invalid file name.");
        var storageRoot = Environment.GetEnvironmentVariable("STORAGE_PATH") ?? Path.Combine(_env.ContentRootPath, "storage");
        var caseDir = Path.Combine(storageRoot, caseId.ToString("N"));
        Directory.CreateDirectory(caseDir);
                var safeName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(caseDir, safeName);
        await using (var stream = System.IO.File.Create(path)) await file.CopyToAsync(stream, ct);
        var doc = new Document { CaseId = caseId, Type = type, FileName = originalName, FilePath = path, FileSize = file.Length, UploadedBy = CurrentUserId, UploadedAt = DateTime.UtcNow };
        _db.Documents.Add(doc); await _db.SaveChangesAsync(ct); return Ok(doc, "Document uploaded");
    }

    [HttpGet("/api/cases/{caseId:guid}/documents")]
    [HttpGet("/api/v1/cases/{caseId:guid}/documents")]
    public async Task<ActionResult<List<Document>>> List(Guid caseId, CancellationToken ct)
    {
        var c = await _db.Cases.FirstOrDefaultAsync(x => x.Id == caseId, ct);
        if (c == null || !CanAccess(c)) return NotFound("Case not found");
        return Ok(await _db.Documents.AsNoTracking().Where(x => x.CaseId == caseId).OrderByDescending(x => x.UploadedAt).ToListAsync(ct));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var d = await _db.Documents.Include(x => x.Case).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (d == null || !CanAccess(d.Case)) return NotFound("Document not found");
        if (System.IO.File.Exists(d.FilePath)) System.IO.File.Delete(d.FilePath);
        _db.Documents.Remove(d); await _db.SaveChangesAsync(ct); return StatusCode(StatusCodes.Status200OK, new { message = "Document deleted" });
    }

    private bool CanAccess(Case c) => CurrentUserRole == UserRole.Admin.ToString() || c.LawyerId == CurrentUserId || c.ClientId == CurrentUserId || c.UserId == CurrentUserId;
}
