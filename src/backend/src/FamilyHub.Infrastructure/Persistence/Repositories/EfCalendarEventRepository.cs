using Microsoft.EntityFrameworkCore;
using FamilyHub.Application.Abstractions;
using FamilyHub.Domain.Models;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Infrastructure.Persistence.Repositories;

internal sealed class EfCalendarEventRepository(FamilyHubDbContext dbContext) : ICalendarEventRepository
{
    public Task<CalendarEvent?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.CalendarEvents.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<CalendarEvent>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        => await dbContext.CalendarEvents
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.StartUtc)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<CalendarEvent>> GetByUserIdsAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default)
    {
        var ids = userIds.ToList();
        return await dbContext.CalendarEvents
            .Where(x => ids.Contains(x.UserId))
            .OrderBy(x => x.StartUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(CalendarEvent calendarEvent, CancellationToken cancellationToken = default)
        => await dbContext.CalendarEvents.AddAsync(calendarEvent, cancellationToken);

    public async Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.CalendarEvents
            .SingleOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
        if (existing is null)
            return false;
        dbContext.CalendarEvents.Remove(existing);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
