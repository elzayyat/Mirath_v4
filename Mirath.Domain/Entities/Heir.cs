using Mirath.Shared.Entities.Base;
using Mirath.Shared.Enums;
using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class Heir : BaseEntity
{
    public Guid CaseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public HeirType Relationship { get; set; }
    public bool IsAlive { get; set; } = true;
    public bool HasChildren { get; set; }
    public Gender Gender { get; set; }
    public string? ShareFraction { get; set; }
    public decimal? ShareValue { get; set; }
    public string? BlockedBy { get; set; }

    // Special-case fields for legally sensitive inheritance rules.
    public Religion Religion { get; set; } = Religion.Muslim;
    public bool IsMurderer { get; set; }
    public bool IsMissing { get; set; }
    public bool IsPregnant { get; set; }

    // Backward-compatible fields used by the existing Faraidh code.
    public HeirType Type { get => Relationship; set => Relationship = value; }
    public int Count { get; set; } = 1;
    public bool IsBlocked { get; set; }
    public string? BlockingReason { get => BlockedBy; set => BlockedBy = value; }

    public virtual Case Case { get; set; } = null!;
}
