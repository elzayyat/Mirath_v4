using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class Case
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CaseNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public Guid? LawyerId { get; set; }
    public Guid? ClientId { get; set; }
    public CaseStatus Status { get; set; } = CaseStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? Notes { get; set; }

    // Backward-compatible fields for the current API/domain services.
    public Guid UserId { get; set; }
    public string DeceasedName { get; set; } = string.Empty;
    public Gender DeceasedGender { get; set; }
    public DateTime DateOfDeath { get; set; }
    public Madhab Madhab { get; set; } = Madhab.General;
    public string? Description { get; set; }
    public decimal TotalAssets { get; set; }
    public decimal TotalDebts { get; set; }
    public decimal FuneralExpenses { get; set; }
    public decimal WillAmount { get; set; }
    public decimal NetEstate { get; set; }
    public bool IsDeleted { get; set; }

    public virtual User? Lawyer { get; set; }
    public virtual User? Client { get; set; }
    public virtual User User { get; set; } = null!;
    public virtual Decedent? Decedent { get; set; }
    public virtual ICollection<Heir> Heirs { get; set; } = new List<Heir>();
    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
    public virtual ICollection<Debt> Debts { get; set; } = new List<Debt>();
    public virtual ICollection<Calculation> Calculations { get; set; } = new List<Calculation>();
    public virtual ICollection<InheritanceResult> InheritanceResults { get; set; } = new List<InheritanceResult>();
    public virtual ICollection<Document> Documents { get; set; } = new List<Document>();
}
