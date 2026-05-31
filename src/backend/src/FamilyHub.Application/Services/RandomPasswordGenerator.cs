using System.Security.Cryptography;

namespace FamilyHub.Application.Services;

internal static class RandomPasswordGenerator
{
    private const string AllowedCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*?-_";

    public static string Generate(int length = 16)
    {
        if (length < 12)
            throw new ArgumentOutOfRangeException(nameof(length), "Password length must be at least 12 characters.");

        var passwordChars = new char[length];
        for (var index = 0; index < length; index++)
        {
            var randomIndex = RandomNumberGenerator.GetInt32(AllowedCharacters.Length);
            passwordChars[index] = AllowedCharacters[randomIndex];
        }

        return new string(passwordChars);
    }
}
