namespace Mirath.Infrastructure.Security;

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string hashedPassword, string providedPassword);
}

public class PasswordHasher : IPasswordHasher
{
    private const int BcryptCost = 12;

    public string HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            throw new ArgumentException("Password must be at least 8 characters.", nameof(password));
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: BcryptCost);
    }

    public bool VerifyPassword(string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword) || string.IsNullOrEmpty(providedPassword)) return false;
        return BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);
    }
}
