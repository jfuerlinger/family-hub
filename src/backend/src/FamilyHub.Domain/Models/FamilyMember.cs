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

    public DateTimeOffset JoinedAtUtc { get; private set; }

    public Family Family { get; private set; } = null!;

    public User User { get; private set; } = null!;

    public static FamilyMember Create(Guid familyId, Guid userId, string? color = null)
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
            JoinedAtUtc = DateTimeOffset.UtcNow,
        };
    }
}
