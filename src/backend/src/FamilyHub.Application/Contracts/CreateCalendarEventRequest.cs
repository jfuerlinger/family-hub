namespace FamilyHub.Application.Contracts;

public sealed record CreateCalendarEventRequest(
    string Title,
    string? Description,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    bool AllDay = false);
