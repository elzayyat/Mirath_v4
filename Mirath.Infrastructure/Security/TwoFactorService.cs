using System.Text;
using System.Security.Cryptography;
using QRCoder;
using Microsoft.Extensions.Logging;

namespace Mirath.Infrastructure.Security;

public interface ITwoFactorService
{
    TwoFactorSetupResult GenerateSetupCode(string email);
    bool VerifyCode(string secretKey, string code);
    string GenerateBackupCodes(int count = 10);
    bool VerifyBackupCode(string[] backupCodes, string providedCode);
}

public record TwoFactorSetupResult(
    string SecretKey,
    string QrCodeImageUrl,
    string ManualEntryKey);

// Base32 Encoding helper
public static class Base32Encoding
{
    public static byte[] ToBytes(string input)
    {
        if (string.IsNullOrEmpty(input))
            throw new ArgumentNullException(nameof(input));
        
        input = input.TrimEnd('=');
        int byteCount = input.Length * 5 / 8;
        byte[] returnArray = new byte[byteCount];
        
        byte curByte = 0, bitsRemaining = 8;
        int mask = 0, arrayIndex = 0;
        
        foreach (char c in input)
        {
            int cValue = CharToValue(c);
            
            if (bitsRemaining > 5)
            {
                mask = cValue << (bitsRemaining - 5);
                curByte = (byte)(curByte | mask);
                bitsRemaining -= 5;
            }
            else
            {
                mask = cValue >> (5 - bitsRemaining);
                curByte = (byte)(curByte | mask);
                returnArray[arrayIndex++] = curByte;
                curByte = (byte)(cValue << (3 + bitsRemaining));
                bitsRemaining += 3;
            }
        }
        
        if (arrayIndex != byteCount)
            returnArray[arrayIndex] = curByte;
        
        return returnArray;
    }
    
    public static string ToString(byte[] input)
    {
        if (input == null || input.Length == 0)
            throw new ArgumentNullException(nameof(input));
        
        int charCount = (int)Math.Ceiling(input.Length / 5d) * 8;
        char[] returnArray = new char[charCount];
        
        byte nextChar = 0, bitsRemaining = 8;
        int arrayIndex = 0;
        
        foreach (byte b in input)
        {
            nextChar = (byte)(nextChar | (b >> (8 - bitsRemaining)));
            returnArray[arrayIndex++] = ValueToChar(nextChar);
            
            if (bitsRemaining < 5)
            {
                returnArray[arrayIndex++] = ValueToChar((byte)(b >> (3 - bitsRemaining)));
                bitsRemaining += 5;
            }
            
            bitsRemaining -= 3;
            nextChar = (byte)((b << bitsRemaining) & 0x1F);
        }
        
        if (arrayIndex != charCount)
            returnArray[arrayIndex++] = ValueToChar(nextChar);
        
        return new string(returnArray);
    }
    
    private static int CharToValue(char c)
    {
        if (c >= 'A' && c <= 'Z')
            return c - 'A';
        if (c >= '2' && c <= '7')
            return c - '2' + 26;
        throw new ArgumentException("Invalid character");
    }
    
    private static char ValueToChar(byte b)
    {
        if (b < 26)
            return (char)('A' + b);
        if (b < 32)
            return (char)('2' + (b - 26));
        throw new ArgumentException("Invalid value");
    }
}

public class TwoFactorService : ITwoFactorService
{
    private readonly ILogger<TwoFactorService> _logger;

    public TwoFactorService(ILogger<TwoFactorService> logger)
    {
        _logger = logger;
    }

    public TwoFactorSetupResult GenerateSetupCode(string email)
    {
        var secretBytes = RandomNumberGenerator.GetBytes(20);
        var secret = Base32Encoding.ToString(secretBytes);
        const string issuer = "Mirath";
        var otpauthUrl =
            $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(email)}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}";

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(otpauthUrl, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var png = qrCode.GetGraphic(20);
        var qrUrl = "data:image/png;base64," + Convert.ToBase64String(png);

        return new TwoFactorSetupResult(secret, qrUrl, secret);
    }

    public bool VerifyCode(string secretKey, string code)
    {
        if (string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(code) || code.Length != 6)
            return false;

        try
        {
            var keyBytes = Base32Encoding.ToBytes(secretKey.ToUpperInvariant());
            var unixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var step = unixSeconds / 30;

            for (var w = -1L; w <= 1; w++)
            {
                if (GenerateTotp(keyBytes, step + w) == code)
                    return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "2FA verification failed");
        }

        return false;
    }

    private static string GenerateTotp(byte[] key, long counter)
    {
        var counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian)
            Array.Reverse(counterBytes);

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counterBytes);
        var offset = hash[^1] & 0x0f;
        var binary = ((hash[offset] & 0x7f) << 24)
            | (hash[offset + 1] << 16)
            | (hash[offset + 2] << 8)
            | hash[offset + 3];
        var otp = binary % 1_000_000;
        return otp.ToString("D6");
    }

    public string GenerateBackupCodes(int count = 10)
    {
        var codes = new string[count];
        for (var i = 0; i < count; i++)
            codes[i] = Convert.ToHexString(RandomNumberGenerator.GetBytes(4)).ToLowerInvariant();
        return string.Join(",", codes);
    }

    public bool VerifyBackupCode(string[] backupCodes, string providedCode) =>
        backupCodes.Any(c => string.Equals(c, providedCode, StringComparison.OrdinalIgnoreCase));
}