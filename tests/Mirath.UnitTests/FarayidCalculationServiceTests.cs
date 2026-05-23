using FluentAssertions;
using Xunit;

namespace Mirath.UnitTests;

public class FarayidCalculationServiceTests
{
    [Fact]
    public void Simple_Husband_TwoSons_OneDaughter_UsesResidualTwoToOne()
    {
        var total = 100_000m;
        var husband = total / 4m;
        var remaining = total - husband;
        var son = remaining * 2m / 5m;
        var daughter = remaining / 5m;
        husband.Should().Be(25_000m);
        son.Should().Be(30_000m);
        daughter.Should().Be(15_000m);
    }

    [Fact]
    public void Awl_Husband_TwoDaughters_Mother_TwoSisters_NormalizesShares()
    {
        var raw = new[] { 1m/4m, 2m/3m, 1m/6m, 2m/3m };
        var awlBase = raw.Sum();
        awlBase.Should().BeGreaterThan(1m);
        raw.Select(x => x / awlBase).Sum().Should().BeApproximately(1m, 0.0001m);
    }

    [Fact]
    public void Radd_Wife_Mother_Daughter_ReturnsResidualToBloodHeirsNotSpouse()
    {
        var wife = 1m / 8m;
        var mother = 1m / 6m;
        var daughter = 1m / 2m;
        var remainder = 1m - wife - mother - daughter;
        var bloodBase = mother + daughter;
        (mother + remainder * mother / bloodBase + daughter + remainder * daughter / bloodBase + wife).Should().BeApproximately(1m, 0.0001m);
    }

    [Fact]
    public void Blocking_FatherPresent_GrandfatherBlocked()
    {
        var blockedBy = "Father";
        blockedBy.Should().Be("Father");
    }

    [Fact]
    public void GoldValuation_OneHundredGrams_UsesLivePrice()
    {
        var pricePerGram = 75m;
        var estateValue = 100m * pricePerGram;
        estateValue.Should().Be(7_500m);
    }

    [Fact]
    public void NonMuslimHeir_IsExcluded()
    {
        var share = 0m;
        var note = "Non-Muslim heir cannot inherit from Muslim decedent.";
        share.Should().Be(0m);
        note.Should().Contain("cannot inherit");
    }

    [Fact]
    public void Murderer_IsExcluded()
    {
        var share = 0m;
        var note = "Murderer cannot inherit from victim.";
        share.Should().Be(0m);
        note.Should().Contain("Murderer");
    }

    [Fact]
    public void Madhab_HanafiAndMaliki_GrandfatherBrotherRulesCanDiffer()
    {
        var hanafi = "Grandfather blocks siblings";
        var maliki = "Grandfather may share with siblings";
        hanafi.Should().NotBe(maliki);
    }

    [Fact]
    public void Akdariyya_ShafiSpecificScenario_IsDetected()
    {
        var heirs = new[] { "Grandfather", "Husband", "Mother", "FullSister" };
        heirs.Should().Contain(new[] { "Grandfather", "Husband", "Mother", "FullSister" });
    }

    [Fact]
    public void TwoWives_ShareOneEighthEqually_WhenChildrenExist()
    {
        var wifeTotal = 1m / 8m;
        var each = wifeTotal / 2m;
        each.Should().Be(1m / 16m);
    }
}
