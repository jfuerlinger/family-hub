using FamilyHub.Application.Contracts;

namespace FamilyHub.Application.Services;

public interface ICalendarService
{
    Task<CalendarEventDto> CreateEventAsync(CreateCalendarEventRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CalendarEventDto>> GetMyEventsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FamilyCalendarEventDto>> GetFamilyEventsAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task<bool> DeleteEventAsync(Guid eventId, CancellationToken cancellationToken = default);
}
