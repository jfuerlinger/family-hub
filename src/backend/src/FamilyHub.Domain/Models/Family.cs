namespace FamilyHub.Domain.Models;

public sealed class Family
{
    private Family()
    {
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public Guid CreatedByUserId { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public ICollection<FamilyMember> Members { get; private set; } = [];

    public static Family Create(string name, Guid createdByUserId)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Family name is required.", nameof(name));

        if (createdByUserId == Guid.Empty)
            throw new ArgumentException("Created by user ID is required.", nameof(createdByUserId));

        return new Family
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };
    }
}
