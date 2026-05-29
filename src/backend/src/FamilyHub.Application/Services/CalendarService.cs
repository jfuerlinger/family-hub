using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Services;

public sealed class CalendarService(
    ICalendarEventRepository calendarEventRepository,
    IFamilyMemberRepository familyMemberRepository,
    ICurrentUserProvider currentUserProvider) : ICalendarService
{
    public async Task<CalendarEventDto> CreateEventAsync(CreateCalendarEventRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Title is required.", nameof(request.Title));

        if (request.EndUtc <= request.StartUtc)
            throw new ArgumentException("End time must be after start time.", nameof(request.EndUtc));

        var calendarEvent = CalendarEvent.Create(userId, request.Title, request.Description, request.StartUtc, request.EndUtc, request.AllDay);
        await calendarEventRepository.AddAsync(calendarEvent, cancellationToken);
        await calendarEventRepository.SaveChangesAsync(cancellationToken);

        return ToDto(calendarEvent);
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
}
