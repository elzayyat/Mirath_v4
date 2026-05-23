using SharedDocument = Mirath.Shared.Entities.Document;
using QuestPdfDocument = QuestPDF.Fluent.Document;
using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;
using System;
using System.Collections.Generic;
using Mirath.Shared.Entities;
using Mirath.Infrastructure.Services;

public interface IPdfGenerationService
{
    Task<byte[]> GenerateInheritanceCertificateAsync(CertificateData data);
    Task<byte[]> GenerateDivisionAgreementAsync(DivisionAgreementData data);
    Task<byte[]> GenerateEstateInventoryAsync(EstateInventoryData data);
    Task<byte[]> GenerateBatchAsync(List<DocumentRequest> requests);
    string GenerateVerificationCode();
}

public record CertificateData(
    string CaseNumber,
    string DeceasedName,
    DateTime DateOfDeath,
    DateTime CalculationDate,
    string Madhab,
    decimal NetEstate,
    List<HeirShareData> Heirs,
    string VerificationCode);

public record HeirShareData(
    string Name,
    string NameAr,
    string Relationship,
    string Fraction,
    double Percentage,
    decimal Amount,
    string ShareType);

public record DivisionAgreementData(
    string CaseNumber,
    string DeceasedName,
    DateTime DateOfDeath,
    DateTime AgreementDate,
    List<HeirShareData> Heirs,
    List<SignatureData> Signatures);

public record EstateInventoryData(
    string CaseNumber,
    string DeceasedName,
    List<AssetData> Assets,
    List<DebtData> Debts,
    decimal TotalEstate,
    decimal NetEstate);

public record AssetData(string Description, string DescriptionAr, decimal Value, string Currency);
public record DebtData(string Creditor, decimal Amount, string Currency);
public record SignatureData(string Name, string NameAr, DateTime DateSigned);

public class PdfGenerationService : IPdfGenerationService
{
    private readonly ILogger<PdfGenerationService> _logger;
    
    public PdfGenerationService(ILogger<PdfGenerationService> logger)
    {
        _logger = logger;
        QuestPDF.Settings.License = LicenseType.Community;
    }
    
    public async Task<byte[]> GenerateInheritanceCertificateAsync(CertificateData data)
    {
        _logger.LogInformation("Generating inheritance certificate for case {CaseNumber}", data.CaseNumber);
        
        var qrCodeImage = GenerateQrCode(data.VerificationCode);
        
        var document = QuestPdfDocument.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));
                
                page.Header()
                    .AlignCenter()
                    .Column(col =>
                    {
                        col.Item().Text("INHERITANCE CERTIFICATE")
                            .FontSize(22).Bold().FontColor("#d4af37");
                        col.Item().Text("شهادة الميراث")
                            .FontSize(18).FontFamily("Traditional Arabic").FontColor("#0a2e36");
                        col.Item().PaddingTop(10).LineHorizontal(1).LineColor("#d4af37");
                    });
                
                page.Content().PaddingVertical(20).Column(col =>
                {
                    // Case Information
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Case Number: {data.CaseNumber}").FontSize(10);
                            c.Item().Text($"Date of Death: {data.DateOfDeath:dd/MM/yyyy}");
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Calculation Date: {data.CalculationDate:dd/MM/yyyy}");
                            c.Item().Text($"Madhab: {data.Madhab}");
                        });
                    });
                    
                    col.Item().PaddingTop(15).Text($"Deceased Name: {data.DeceasedName}")
                        .FontSize(12).Bold();
                    
                    col.Item().PaddingTop(10).Text($"Net Estate: {data.NetEstate:C2}")
                        .FontSize(14).Bold().FontColor("#d4af37");
                    
                    // Heirs Table
                    col.Item().PaddingTop(15).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(80);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });
                        
                        table.Header(header =>
                        {
                            header.Cell().Background("#d4af37").Text("Heir").Bold();
                            header.Cell().Background("#d4af37").Text("Relationship").Bold();
                            header.Cell().Background("#d4af37").Text("Fraction").Bold();
                            header.Cell().Background("#d4af37").Text("Percentage").Bold();
                            header.Cell().Background("#d4af37").Text("Amount").Bold();
                        });
                        
                        foreach (var heir in data.Heirs)
                        {
                            table.Cell().Text(heir.Name);
                            table.Cell().Text(heir.Relationship);
                            table.Cell().Text(heir.Fraction);
                            table.Cell().Text($"{heir.Percentage:F2}%");
                            table.Cell().Text($"{heir.Amount:C2}");
                        }
                    });
                    
                    // Total
                    col.Item().PaddingTop(10).AlignRight().Text($"Total: {data.Heirs.Sum(h => h.Amount):C2}")
                        .FontSize(12).Bold();
                    
                    // QR Code
                    col.Item().PaddingTop(20).AlignCenter().Width(100).Height(100).Image(qrCodeImage);
                    
                    // Verification Text
                    col.Item().AlignCenter().Text($"Verification Code: {data.VerificationCode}")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                    
                    // Footer
                    col.Item().PaddingTop(20).Text("This certificate is generated by Mirath System - Islamic Inheritance Calculator")
                        .FontSize(8).FontColor(Colors.Grey.Medium).AlignCenter();
                });
                
                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                        x.Span(" of ");
                        x.TotalPages();
                    });
            });
        });
        
        return await Task.FromResult(document.GeneratePdf());
    }
    
    public async Task<byte[]> GenerateDivisionAgreementAsync(DivisionAgreementData data)
    {
        var document = QuestPdfDocument.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                
                page.Header()
                    .AlignCenter()
                    .Column(col =>
                    {
                        col.Item().Text("DIVISION AGREEMENT")
                            .FontSize(20).Bold().FontColor("#d4af37");
                        col.Item().Text("اتفاقية التقسيم")
                            .FontSize(16).FontFamily("Traditional Arabic").FontColor("#0a2e36");
                        col.Item().PaddingTop(10).LineHorizontal(1).LineColor("#d4af37");
                    });
                
                page.Content().Column(col =>
                {
                    col.Item().Text($"This Division Agreement is made on {data.AgreementDate:dd/MM/yyyy}")
                        .FontSize(10);
                    
                    col.Item().PaddingTop(10).Text($"Case Number: {data.CaseNumber}");
                    col.Item().Text($"Deceased: {data.DeceasedName}");
                    col.Item().Text($"Date of Death: {data.DateOfDeath:dd/MM/yyyy}");
                    
                    col.Item().PaddingTop(15).Text("The undersigned heirs hereby agree to the following distribution:")
                        .FontSize(11).Bold();
                    
                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });
                        
                        table.Header(header =>
                        {
                            header.Cell().Text("Heir Name").Bold();
                            header.Cell().Text("Share Percentage").Bold();
                            header.Cell().Text("Amount").Bold();
                        });
                        
                        foreach (var heir in data.Heirs)
                        {
                            table.Cell().Text(heir.Name);
                            table.Cell().Text($"{heir.Percentage:F2}%");
                            table.Cell().Text($"{heir.Amount:C2}");
                        }
                    });
                    
                    // Signature section
                    col.Item().PaddingTop(20).Text("SIGNATURES:").FontSize(11).Bold();
                    
                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });
                        
                        foreach (var signature in data.Signatures)
                        {
                            table.Cell().Text(signature.Name);
                            table.Cell().Text("_________________");
                            table.Cell().Text(signature.DateSigned.ToString("dd/MM/yyyy"));
                        }
                    });
                    
                    // Witness section
                    col.Item().PaddingTop(15).Text("WITNESSES:").FontSize(11).Bold();
                    col.Item().PaddingTop(5).Row(row =>
                    {
                        row.RelativeItem().Text("Witness 1: _________________");
                        row.RelativeItem().Text("Witness 2: _________________");
                    });
                });
            });
        });
        
        return await Task.FromResult(document.GeneratePdf());
    }
    
    public async Task<byte[]> GenerateEstateInventoryAsync(EstateInventoryData data)
    {
        var document = QuestPdfDocument.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                
                page.Header()
                    .AlignCenter()
                    .Column(col =>
                    {
                        col.Item().Text("ESTATE INVENTORY")
                            .FontSize(20).Bold().FontColor("#d4af37");
                        col.Item().Text("محضر جرد التركة")
                            .FontSize(16).FontFamily("Traditional Arabic").FontColor("#0a2e36");
                        col.Item().PaddingTop(10).LineHorizontal(1).LineColor("#d4af37");
                    });
                
                page.Content().Column(col =>
                {
                    col.Item().Text($"Case Number: {data.CaseNumber}");
                    col.Item().Text($"Deceased: {data.DeceasedName}");
                    
                    col.Item().PaddingTop(15).Text("ASSETS (الأصول):").FontSize(12).Bold();
                    col.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.ConstantColumn(80);
                        });
                        
                        table.Header(header =>
                        {
                            header.Cell().Text("Description").Bold();
                            header.Cell().Text("الوصف").Bold();
                            header.Cell().Text("Value").Bold();
                            header.Cell().Text("Currency").Bold();
                        });
                        
                        foreach (var asset in data.Assets)
                        {
                            table.Cell().Text(asset.Description);
                            table.Cell().Text(asset.DescriptionAr);
                            table.Cell().Text($"{asset.Value:N2}");
                            table.Cell().Text(asset.Currency);
                        }
                        
                        table.Cell().Text("TOTAL").Bold();
                        table.Cell().Text("");
                        table.Cell().Text($"{data.Assets.Sum(a => a.Value):N2}").Bold();
                        table.Cell().Text("");
                    });
                    
                    col.Item().PaddingTop(15).Text("LIABILITIES (الخصوم):").FontSize(12).Bold();
                    col.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.ConstantColumn(80);
                        });
                        
                        table.Header(header =>
                        {
                            header.Cell().Text("Creditor").Bold();
                            header.Cell().Text("Amount").Bold();
                            header.Cell().Text("Currency").Bold();
                        });
                        
                        foreach (var debt in data.Debts)
                        {
                            table.Cell().Text(debt.Creditor);
                            table.Cell().Text($"{debt.Amount:N2}");
                            table.Cell().Text(debt.Currency);
                        }
                    });
                    
                    col.Item().PaddingTop(15).Row(row =>
                    {
                        row.RelativeItem().Text("Total Assets:").FontSize(12).Bold();
                        row.RelativeItem().Text($"{data.TotalEstate:C2}").FontSize(12).Bold().FontColor("#d4af37");
                    });
                    
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text("Net Estate after Liabilities:").FontSize(12).Bold();
                        row.RelativeItem().Text($"{data.NetEstate:C2}").FontSize(14).Bold().FontColor("#0a2e36");
                    });
                });
            });
        });
        
        return await Task.FromResult(document.GeneratePdf());
    }
    
    private byte[] GenerateQrCode(string verificationCode)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(verificationCode, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }
    
    public string GenerateVerificationCode()
    {
        return $"MIR-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
    }
    
    public async Task<byte[]> GenerateBatchAsync(List<DocumentRequest> requests)
    {
        using var outputStream = new MemoryStream();
        using var zipArchive = new System.IO.Compression.ZipArchive(outputStream, System.IO.Compression.ZipArchiveMode.Create, true);
        
        foreach (var request in requests)
        {
            byte[] pdfBytes = request.Type switch
            {
                "certificate" => await GenerateInheritanceCertificateAsync(request.CertificateData!),
                "agreement" => await GenerateDivisionAgreementAsync(request.AgreementData!),
                "inventory" => await GenerateEstateInventoryAsync(request.InventoryData!),
                _ => throw new ArgumentException($"Unknown document type: {request.Type}")
            };
            
            var entry = zipArchive.CreateEntry($"{request.Type}_{request.CaseNumber}_{DateTime.Now:yyyyMMdd}.pdf");
            using var entryStream = entry.Open();
            await entryStream.WriteAsync(pdfBytes);
        }
        
        return outputStream.ToArray();
    }
}