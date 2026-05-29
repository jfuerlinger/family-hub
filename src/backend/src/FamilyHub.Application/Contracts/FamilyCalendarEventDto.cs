namespace FamilyHub.Application.Contracts;

public sealed record FamilyCalendarEventDto(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    bool AllDay,
    DateTimeOffset CreatedAtUtc,
    string MemberName,
    string MemberColor);
