namespace FamilyHub.Domain.Models;

public sealed class TodoItem
{
    private TodoItem()
    {
    }

    public Guid Id { get; private set; }

    public Guid FamilyId { get; private set; }

    public Guid CreatedByUserId { get; private set; }

    public Guid? AssignedToUserId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public bool IsDone { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public DateTimeOffset? DueDateUtc { get; private set; }

    public DateTimeOffset? CompletedAtUtc { get; private set; }

    public static TodoItem Create(
        Guid familyId,
        Guid createdByUserId,
        string title,
        string? description,
        Guid? assignedToUserId,
        DateTimeOffset? dueDateUtc = null)
    {
        if (familyId == Guid.Empty)
            throw new ArgumentException("Family ID is required.", nameof(familyId));

        if (createdByUserId == Guid.Empty)
            throw new ArgumentException("Created by user ID is required.", nameof(createdByUserId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required.", nameof(title));

        return new TodoItem
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            CreatedByUserId = createdByUserId,
            AssignedToUserId = assignedToUserId,
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            DueDateUtc = dueDateUtc,
            IsDone = false,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };
    }

    public void MarkAsDone()
    {
        IsDone = true;
        CompletedAtUtc = DateTimeOffset.UtcNow;
    }

    public void MarkAsPending()
    {
        IsDone = false;
        CompletedAtUtc = null;
    }

    public void UpdateAssignment(Guid? assignedToUserId)
    {
        AssignedToUserId = assignedToUserId;
    }
}
