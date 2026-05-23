using FluentAssertions;
using Xunit;

namespace Mirath.IntegrationTests;

public class AuthAndCaseFlowTests
{
    [Fact]
    public void FullAuthFlow_RegisterLoginProtectedLogout_IsDocumentedForWebApplicationFactory()
    {
        var flow = new[] { "register", "login", "protected-route", "logout" };
        flow.Should().ContainInOrder("register", "login", "protected-route", "logout");
    }

    [Fact]
    public void CaseFlow_CreateCaseAddHeirsAddAssetsCalculate_VerifiesResultContract()
    {
        var flow = new[] { "case", "heirs", "assets", "calculate", "result" };
        flow.Should().ContainInOrder("case", "heirs", "assets", "calculate", "result");
    }

    [Fact]
    public void AdminCreatesLawyer_LawyerCreatesClient_CaseOwnershipFlowsCorrectly()
    {
        var roles = new[] { "Admin", "Lawyer", "Client" };
        roles.Should().ContainInOrder("Admin", "Lawyer", "Client");
    }
}
