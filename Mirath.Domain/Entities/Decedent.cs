using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class Decedent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime DeathDate { get; set; }
    public Religion Religion { get; set; } = Religion.Muslim;
    public MaritalStatus MaritalStatus { get; set; } = MaritalStatus.Married;
    public string? Notes { get; set; }

    public virtual Case Case { get; set; } = null!;
}
