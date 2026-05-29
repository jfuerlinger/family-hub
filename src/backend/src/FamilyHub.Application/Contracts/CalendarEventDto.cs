namespace FamilyHub.Application.Contracts;

public sealed record CalendarEventDto(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    bool AllDay,
    DateTimeOffset CreatedAtUtc);
