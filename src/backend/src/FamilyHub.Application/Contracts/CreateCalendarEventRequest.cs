namespace FamilyHub.Application.Contracts;

public sealed record CreateCalendarEventRequest(
    string Title,
    string? Description,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    bool AllDay = false,
    CalendarRecurrenceFrequency Recurrence = CalendarRecurrenceFrequency.None,
    int RecurrenceInterval = 1,
    DateTimeOffset? RecurrenceUntilUtc = null,
    int? RecurrenceCount = null);
