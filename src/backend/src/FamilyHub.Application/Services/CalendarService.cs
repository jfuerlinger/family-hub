using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Services;

public sealed class CalendarService(
    ICalendarEventRepository calendarEventRepository,
    IFamilyMemberRepository familyMemberRepository,
    ICurrentUserProvider currentUserProvider) : ICalendarService
{
    private const int MaxSeriesOccurrences = 365;

    public async Task<CalendarEventDto> CreateEventAsync(CreateCalendarEventRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request.Title));

        if (request.EndUtc <= request.StartUtc)
            throw new ArgumentException("End time must be after start time.", nameof(request.EndUtc));

        ValidateRecurrence(request);

        var occurrences = BuildOccurrences(request);
        CalendarEvent? firstEvent = null;

        foreach (var occurrence in occurrences)
        {
            var calendarEvent = CalendarEvent.Create(
                userId,
                request.Title,
                request.Description,
                occurrence.StartUtc,
                occurrence.EndUtc,
                request.AllDay);

            await calendarEventRepository.AddAsync(calendarEvent, cancellationToken);
            firstEvent ??= calendarEvent;
        }

        await calendarEventRepository.SaveChangesAsync(cancellationToken);

        return ToDto(firstEvent!);
    }

    public async Task<IReadOnlyList<CalendarEventDto>> GetMyEventsAsync(CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        var events = await calendarEventRepository.GetByUserIdAsync(userId, cancellationToken);
        return events.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<FamilyCalendarEventDto>> GetFamilyEventsAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        var membership = await familyMemberRepository.GetByFamilyAndUserAsync(familyId, userId, cancellationToken);
        if (membership is null)
            throw new UnauthorizedAccessException("You are not a member of this family.");

        var members = await familyMemberRepository.GetByFamilyIdWithUsersAsync(familyId, cancellationToken);
        var memberMap = members.ToDictionary(m => m.UserId, m => m);
        var userIds = members.Select(m => m.UserId).ToList();
        var events = await calendarEventRepository.GetByUserIdsAsync(userIds, cancellationToken);

        return events.Select(e =>
        {
            memberMap.TryGetValue(e.UserId, out var member);
            var name = member is not null
                ? $"{member.User.FirstName} {member.User.LastName}".Trim()
                : "Unbekannt";
            var color = member?.Color ?? "#4f46e5";
            return new FamilyCalendarEventDto(e.Id, e.UserId, e.Title, e.Description, e.StartUtc, e.EndUtc, e.AllDay, e.CreatedAtUtc, name, color);
        }).ToList();
    }

    public async Task<bool> DeleteEventAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        return await calendarEventRepository.DeleteAsync(eventId, userId, cancellationToken);
    }

    private static CalendarEventDto ToDto(CalendarEvent e)
    {
        return new CalendarEventDto(e.Id, e.UserId, e.Title, e.Description, e.StartUtc, e.EndUtc, e.AllDay, e.CreatedAtUtc);
    }

    private static void ValidateRecurrence(CreateCalendarEventRequest request)
    {
        if (request.RecurrenceInterval < 1)
            throw new ArgumentException("Recurrence interval must be at least 1.", nameof(request.RecurrenceInterval));

        if (request.RecurrenceCount is <= 0)
            throw new ArgumentException("Recurrence count must be at least 1.", nameof(request.RecurrenceCount));

        if (request.Recurrence == CalendarRecurrenceFrequency.None)
        {
            if (request.RecurrenceUntilUtc is not null || request.RecurrenceCount is not null)
                throw new ArgumentException("Recurrence boundaries are only allowed when recurrence is enabled.", nameof(request.Recurrence));
            return;
        }

        if (request.RecurrenceUntilUtc is null && request.RecurrenceCount is null)
            throw new ArgumentException("Recurring events require an end date or recurrence count.", nameof(request.Recurrence));

        if (request.RecurrenceUntilUtc is not null && request.RecurrenceUntilUtc.Value < request.StartUtc)
            throw new ArgumentException("Recurrence end must be at or after the first event start.", nameof(request.RecurrenceUntilUtc));
    }

    private static IReadOnlyList<(DateTimeOffset StartUtc, DateTimeOffset EndUtc)> BuildOccurrences(CreateCalendarEventRequest request)
    {
        var duration = request.EndUtc - request.StartUtc;
        var occurrences = new List<(DateTimeOffset StartUtc, DateTimeOffset EndUtc)>();
        var occurrenceIndex = 0;

        while (true)
        {
            var currentStart = GetOccurrenceStart(request, occurrenceIndex);

            if (request.RecurrenceUntilUtc is not null && currentStart > request.RecurrenceUntilUtc.Value)
                break;

            if (request.RecurrenceCount is not null && occurrences.Count >= request.RecurrenceCount.Value)
                break;

            if (occurrences.Count >= MaxSeriesOccurrences)
                throw new ArgumentException($"A series can contain at most {MaxSeriesOccurrences} occurrences.", nameof(request.RecurrenceCount));

            occurrences.Add((currentStart, currentStart + duration));

            if (request.Recurrence == CalendarRecurrenceFrequency.None)
                break;

            occurrenceIndex++;
        }

        return occurrences;
    }

    private static DateTimeOffset GetOccurrenceStart(CreateCalendarEventRequest request, int occurrenceIndex)
    {
        return request.Recurrence switch
        {
            CalendarRecurrenceFrequency.None => request.StartUtc,
            CalendarRecurrenceFrequency.Daily => request.StartUtc.AddDays((long)occurrenceIndex * request.RecurrenceInterval),
            CalendarRecurrenceFrequency.Weekly => request.StartUtc.AddDays((long)occurrenceIndex * 7 * request.RecurrenceInterval),
            CalendarRecurrenceFrequency.Monthly => request.StartUtc.AddMonths(occurrenceIndex * request.RecurrenceInterval),
            _ => throw new ArgumentOutOfRangeException(nameof(request.Recurrence), request.Recurrence, "Unsupported recurrence."),
        };
    }
}
