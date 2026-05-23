using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class Asset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public AssetType Type { get; set; } = AssetType.Other;
    public string Description { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal? Weight { get; set; }
    public string? Unit { get; set; }

    public DateTime ValuationDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public virtual Case Case { get; set; } = null!;
}
