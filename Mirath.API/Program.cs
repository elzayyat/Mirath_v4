using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using MediatR;
using Mirath.API.Hubs;
using Mirath.API.Middleware;
using Mirath.Application.Features.Auth.Commands;
using Mirath.Application.Services;
using Mirath.Infrastructure.Identity;
using Mirath.Infrastructure.Persistence;
using Mirath.Infrastructure.Security;
using Mirath.Infrastructure.Services;
using Mirath.Domain.Services;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/mirath-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));
builder.Services.AddProblemDetails();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Mirath Islamic Inheritance System API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "Bearer", BearerFormat = "JWT", In = ParameterLocation.Header });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() } });
});

var configuredConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("PostgreSQL connection string is missing. Set DATABASE_URL or POSTGRES_CONNECTION_STRING.");
if (configuredConnectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || configuredConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    configuredConnectionString = ConvertPostgresUrlToNpgsqlConnectionString(configuredConnectionString);
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(configuredConnectionString, npgsql => npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

var jwtSettings = new JwtSettings
{
    Secret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? builder.Configuration["Jwt:Secret"] ?? string.Empty,
    Issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? builder.Configuration["Jwt:Issuer"] ?? "mirath-api",
    Audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? builder.Configuration["Jwt:Audience"] ?? "mirath-client",
    AccessTokenExpiryMinutes = int.TryParse(builder.Configuration["Jwt:AccessTokenExpiryMinutes"], out var accessMins) ? accessMins : 15,
    RefreshTokenExpiryDays = int.TryParse(builder.Configuration["Jwt:RefreshTokenExpiryDays"], out var refreshDays) ? refreshDays : 7
};
ValidateJwtSettings(jwtSettings, builder.Environment);
builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = jwtSettings.Secret;
    options.Issuer = jwtSettings.Issuer;
    options.Audience = jwtSettings.Audience;
    options.AccessTokenExpiryMinutes = jwtSettings.AccessTokenExpiryMinutes;
    options.RefreshTokenExpiryDays = jwtSettings.RefreshTokenExpiryDays;
});

var signingKey = Encoding.UTF8.GetBytes(jwtSettings.Secret);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(signingKey),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

builder.Services.AddAuthorization(options =>
{
    AuthorizationPolicies.AddPolicies(options);
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
});

var frontendOrigin = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");
var allowedOrigins = !string.IsNullOrWhiteSpace(frontendOrigin) ? new[] { frontendOrigin } : builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueProcessingOrder = QueueProcessingOrder.OldestFirst, QueueLimit = 0 }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddSignalR();
builder.Services.AddHealthChecks().AddNpgSql(configuredConnectionString, name: "postgres");
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();
builder.Services.AddScoped<IAccountLockoutService, AccountLockoutService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.AddScoped<IFaraidhEngine, FaraidhEngine>();
builder.Services.AddScoped<IFarayidCalculationService, FarayidCalculationService>();
builder.Services.AddScoped<IPdfGenerationService, PdfGenerationService>();
builder.Services.AddHttpClient();
builder.Services.Configure<AIOptions>(builder.Configuration.GetSection("OpenAI"));
builder.Services.AddScoped<IAIAssistantService, AIAssistantService>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthorizationHandler, CaseOwnerHandler>();
builder.Services.Configure<ForwardedHeadersOptions>(options => { options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto; options.KnownNetworks.Clear(); options.KnownProxies.Clear(); });

var app = builder.Build();
app.UseForwardedHeaders();
app.UseMiddleware<ExceptionHandlingMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "Mirath API v1"); c.RoutePrefix = "swagger"; });
}
else
{
    app.UseHsts();
}
app.UseSerilogRequestLogging();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SensitiveOperationAuditMiddleware>();
app.MapControllers();
app.MapHealthChecks("/health");
app.MapHub<NotificationHub>("/hubs/notification");
app.MapHub<CalculationHub>("/hubs/calculation");

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
}

await app.RunAsync();

static string ConvertPostgresUrlToNpgsqlConnectionString(string databaseUrl)
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':', 2);
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
    var database = uri.AbsolutePath.TrimStart('/');
    return $"Host={uri.Host};Port={uri.Port};Database={database};Username={username};Password={password};SSL Mode=Prefer;Trust Server Certificate=true";
}

static void ValidateJwtSettings(JwtSettings jwtSettings, IWebHostEnvironment environment)
{
    if (string.IsNullOrWhiteSpace(jwtSettings.Secret)) throw new InvalidOperationException("JWT_SECRET is missing.");
    if (jwtSettings.Secret.Length < 64) throw new InvalidOperationException("JWT_SECRET must be at least 64 characters long.");
    if (string.Equals(jwtSettings.Secret, "CHANGE_ME_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS", StringComparison.Ordinal)) throw new InvalidOperationException("Refusing to start with a placeholder JWT secret.");
    if (string.IsNullOrWhiteSpace(jwtSettings.Issuer) || string.IsNullOrWhiteSpace(jwtSettings.Audience)) throw new InvalidOperationException("JWT issuer and audience must both be configured.");
}

public partial class Program { }
