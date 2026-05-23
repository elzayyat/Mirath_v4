using Mirath.Domain.Enums;
using Mirath.Domain.Services;
using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Tests.CalculationEngine;

public class EdgeCasesTests
{
    private readonly FaraidhEngine _engine = new();

    [Fact]
    public async Task CalculateAsync_ReturnsShares_ForBasicHeirs()
    {
        var heirs = new List<Heir>
        {
            new() { Type = HeirType.Husband, Name = "الزوج", Count = 1 },
            new() { Type = HeirType.Mother, Name = "الأم", Count = 1 }
        };

        const decimal netEstate = 100_000m;
        var result = await _engine.CalculateAsync(heirs, netEstate, Madhab.General, CancellationToken.None);

        Assert.NotEmpty(result.Shares);
        Assert.True(result.TotalRatio > 0);
    }

    [Fact]
    public async Task CalculateAsync_AppliesAwl_WhenTotalRatioExceedsOne()
    {
        var heirs = new List<Heir>
        {
            new() { Type = HeirType.Husband, Name = "الزوج", Count = 1 },
            new() { Type = HeirType.Mother, Name = "الأم", Count = 1 },
            new() { Type = HeirType.Daughter, Name = "البنت", Count = 1 }
        };

        const decimal netEstate = 100_000m;
        var result = await _engine.CalculateAsync(heirs, netEstate, Madhab.General, CancellationToken.None);

        if (result.IsAwlApplied)
            Assert.InRange(result.TotalRatio, 0.99, 1.01);
    }
}
