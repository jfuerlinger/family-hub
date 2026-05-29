using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Abstractions;

public interface ICalendarEventRepository
{
    Task<CalendarEvent?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CalendarEvent>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CalendarEvent>> GetByUserIdsAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
    Task AddAsync(CalendarEvent calendarEvent, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
