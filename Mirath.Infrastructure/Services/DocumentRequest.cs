namespace Mirath.Infrastructure.Services;

public record DocumentRequest(
    string Type,
    string CaseNumber,
    CertificateData? CertificateData,
    DivisionAgreementData? AgreementData,
    EstateInventoryData? InventoryData);