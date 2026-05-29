namespace FamilyHub.Domain.Models;

public sealed class CalendarEvent
{
    private CalendarEvent()
    {
    }

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public DateTimeOffset StartUtc { get; private set; }

    public DateTimeOffset EndUtc { get; private set; }

    public bool AllDay { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public static CalendarEvent Create(
        Guid userId,
        string title,
        string? description,
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        bool allDay = false)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User ID is required.", nameof(userId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required.", nameof(title));

        if (endUtc <= startUtc)
            throw new ArgumentException("End time must be after start time.", nameof(endUtc));

        return new CalendarEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            StartUtc = startUtc,
            EndUtc = endUtc,
            AllDay = allDay,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };
    }
}
