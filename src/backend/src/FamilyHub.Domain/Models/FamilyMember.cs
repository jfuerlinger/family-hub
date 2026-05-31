namespace FamilyHub.Domain.Models;

public sealed class FamilyMember
{
    private FamilyMember()
    {
    }

    public Guid Id { get; private set; }

    public Guid FamilyId { get; private set; }

    public Guid UserId { get; private set; }

    public string Color { get; private set; } = "#4f46e5";

    public string? PhoneNumber { get; private set; }

    public bool IsAdmin { get; private set; }

    public DateTimeOffset JoinedAtUtc { get; private set; }

    public Family Family { get; private set; } = null!;

    public User User { get; private set; } = null!;

    public static FamilyMember Create(
        Guid familyId,
        Guid userId,
        string? color = null,
        string? phoneNumber = null,
        bool isAdmin = false)
    {
        if (familyId == Guid.Empty)
            throw new ArgumentException("Family ID is required.", nameof(familyId));

        if (userId == Guid.Empty)
            throw new ArgumentException("User ID is required.", nameof(userId));

        return new FamilyMember
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            UserId = userId,
            Color = string.IsNullOrWhiteSpace(color) ? "#4f46e5" : color.Trim(),
            PhoneNumber = NormalizePhoneNumber(phoneNumber),
            IsAdmin = isAdmin,
            JoinedAtUtc = DateTimeOffset.UtcNow,
        };
    }

    public void UpdatePhoneNumber(string? phoneNumber)
    {
        PhoneNumber = NormalizePhoneNumber(phoneNumber);
    }

    public void SetAdmin(bool isAdmin)
    {
        IsAdmin = isAdmin;
    }

    private static string? NormalizePhoneNumber(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return null;

        return phoneNumber.Trim();
    }
}
