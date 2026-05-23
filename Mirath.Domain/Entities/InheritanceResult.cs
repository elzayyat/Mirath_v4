using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class InheritanceResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public decimal TotalEstate { get; set; }
    public decimal TotalDebts { get; set; }
    public decimal NetEstate { get; set; }
    public InheritanceAlgorithm Algorithm { get; set; } = InheritanceAlgorithm.Hanafi;
    public string Results { get; set; } = "{}";
    public string? Notes { get; set; }

    public virtual Case Case { get; set; } = null!;
}
