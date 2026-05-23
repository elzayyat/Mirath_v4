using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mirath.Infrastructure.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NameEnglish = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NameArabic = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AuthProvider = table.Column<int>(type: "integer", nullable: false),
                    GoogleSubjectId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsEmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IsTwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorSecret = table.Column<string>(type: "text", nullable: true),
                    BackupCodes = table.Column<string>(type: "text", nullable: true),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    RefreshTokenExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmailVerificationToken = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EmailVerificationTokenExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordResetToken = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PasswordResetTokenExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DefaultMadhab = table.Column<int>(type: "integer", nullable: false),
                    Language = table.Column<string>(type: "text", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsSystemProtected = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_Users", x => x.Id));

            migrationBuilder.CreateTable(
                name: "Cases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    LawyerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeceasedName = table.Column<string>(type: "text", nullable: false),
                    DeceasedGender = table.Column<int>(type: "integer", nullable: false),
                    DateOfDeath = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Madhab = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    TotalAssets = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalDebts = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    FuneralExpenses = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    WillAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetEstate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cases", x => x.Id);
                    table.ForeignKey("FK_Cases_Users_ClientId", x => x.ClientId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_Cases_Users_LawyerId", x => x.LawyerId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_Cases_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Assets",
                columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), CaseId = table.Column<Guid>(type: "uuid", nullable: false), Type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false), Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false), Value = table.Column<decimal>(type: "numeric(18,2)", nullable: false), Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false), Weight = table.Column<decimal>(type: "numeric(18,3)", nullable: true), Unit = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true), ValuationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false) },
                constraints: table => { table.PrimaryKey("PK_Assets", x => x.Id); table.ForeignKey("FK_Assets_Cases_CaseId", x => x.CaseId, "Cases", "Id", onDelete: ReferentialAction.Cascade); });
            migrationBuilder.CreateTable(
                name: "Decedents",
                columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), CaseId = table.Column<Guid>(type: "uuid", nullable: false), Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false), DeathDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), Religion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false), MaritalStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false), Notes = table.Column<string>(type: "text", nullable: true) },
                constraints: table => { table.PrimaryKey("PK_Decedents", x => x.Id); table.ForeignKey("FK_Decedents_Cases_CaseId", x => x.CaseId, "Cases", "Id", onDelete: ReferentialAction.Cascade); });
            migrationBuilder.CreateTable(
                name: "Heirs",
                columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), CaseId = table.Column<Guid>(type: "uuid", nullable: false), Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false), Relationship = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false), IsAlive = table.Column<bool>(type: "boolean", nullable: false), HasChildren = table.Column<bool>(type: "boolean", nullable: false), Gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false), ShareFraction = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true), ShareValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true), BlockedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true), Religion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Muslim"), IsMurderer = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false), IsMissing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false), IsPregnant = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false), Count = table.Column<int>(type: "integer", nullable: false), IsBlocked = table.Column<bool>(type: "boolean", nullable: false), CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true), CreatedBy = table.Column<string>(type: "text", nullable: true), UpdatedBy = table.Column<string>(type: "text", nullable: true), IsDeleted = table.Column<bool>(type: "boolean", nullable: false) },
                constraints: table => { table.PrimaryKey("PK_Heirs", x => x.Id); table.ForeignKey("FK_Heirs_Cases_CaseId", x => x.CaseId, "Cases", "Id", onDelete: ReferentialAction.Cascade); });
            migrationBuilder.CreateTable(
                name: "InheritanceResults",
                columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), CaseId = table.Column<Guid>(type: "uuid", nullable: false), CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), TotalEstate = table.Column<decimal>(type: "numeric(18,2)", nullable: false), TotalDebts = table.Column<decimal>(type: "numeric(18,2)", nullable: false), NetEstate = table.Column<decimal>(type: "numeric(18,2)", nullable: false), Algorithm = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false), Results = table.Column<string>(type: "jsonb", nullable: false), Notes = table.Column<string>(type: "text", nullable: true) },
                constraints: table => { table.PrimaryKey("PK_InheritanceResults", x => x.Id); table.ForeignKey("FK_InheritanceResults_Cases_CaseId", x => x.CaseId, "Cases", "Id", onDelete: ReferentialAction.Cascade); });
            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), CaseId = table.Column<Guid>(type: "uuid", nullable: false), Type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false), FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false), FilePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false), UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), UploadedBy = table.Column<Guid>(type: "uuid", nullable: true), FileSize = table.Column<long>(type: "bigint", nullable: false), Language = table.Column<string>(type: "text", nullable: false), VerificationCode = table.Column<string>(type: "text", nullable: true) },
                constraints: table => { table.PrimaryKey("PK_Documents", x => x.Id); table.ForeignKey("FK_Documents_Cases_CaseId", x => x.CaseId, "Cases", "Id", onDelete: ReferentialAction.Cascade); table.ForeignKey("FK_Documents_Users_UploadedBy", x => x.UploadedBy, "Users", "Id", onDelete: ReferentialAction.SetNull); });
            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), UserId = table.Column<Guid>(type: "uuid", nullable: false), Message = table.Column<string>(type: "text", nullable: false), IsRead = table.Column<bool>(type: "boolean", nullable: false), CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), Link = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true), Title = table.Column<string>(type: "text", nullable: false), Metadata = table.Column<string>(type: "text", nullable: true) },
                constraints: table => { table.PrimaryKey("PK_Notifications", x => x.Id); table.ForeignKey("FK_Notifications_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade); });
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new { Id = table.Column<Guid>(type: "uuid", nullable: false), UserId = table.Column<Guid>(type: "uuid", nullable: true), Action = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false), EntityType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true), EntityId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true), Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false), Details = table.Column<string>(type: "jsonb", nullable: true), OldValues = table.Column<string>(type: "text", nullable: true), NewValues = table.Column<string>(type: "text", nullable: true), IpAddress = table.Column<string>(type: "text", nullable: true), UserAgent = table.Column<string>(type: "text", nullable: true), Success = table.Column<bool>(type: "boolean", nullable: false), ErrorMessage = table.Column<string>(type: "text", nullable: true) },
                constraints: table => table.PrimaryKey("PK_AuditLogs", x => x.Id));

            migrationBuilder.CreateIndex("IX_Users_Email", "Users", "Email", unique: true);
            migrationBuilder.CreateIndex("IX_Cases_CaseNumber", "Cases", "CaseNumber", unique: true);
            migrationBuilder.CreateIndex("IX_Cases_ClientId", "Cases", "ClientId");
            migrationBuilder.CreateIndex("IX_Cases_LawyerId", "Cases", "LawyerId");
            migrationBuilder.CreateIndex("IX_Cases_UserId", "Cases", "UserId");
            migrationBuilder.CreateIndex("IX_Assets_CaseId", "Assets", "CaseId");
            migrationBuilder.CreateIndex("IX_Decedents_CaseId", "Decedents", "CaseId", unique: true);
            migrationBuilder.CreateIndex("IX_Heirs_CaseId", "Heirs", "CaseId");
            migrationBuilder.CreateIndex("IX_InheritanceResults_CaseId", "InheritanceResults", "CaseId");
            migrationBuilder.CreateIndex("IX_Documents_CaseId", "Documents", "CaseId");
            migrationBuilder.CreateIndex("IX_Documents_UploadedBy", "Documents", "UploadedBy");
            migrationBuilder.CreateIndex("IX_Notifications_UserId", "Notifications", "UserId");
            migrationBuilder.CreateIndex("IX_AuditLogs_UserId_Timestamp", "AuditLogs", new[] { "UserId", "Timestamp" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("AuditLogs");
            migrationBuilder.DropTable("Notifications");
            migrationBuilder.DropTable("Documents");
            migrationBuilder.DropTable("InheritanceResults");
            migrationBuilder.DropTable("Heirs");
            migrationBuilder.DropTable("Decedents");
            migrationBuilder.DropTable("Assets");
            migrationBuilder.DropTable("Cases");
            migrationBuilder.DropTable("Users");
        }
    }
}
