using FluentAssertions;
using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Application.Services;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Tests;

public sealed class CalendarServiceTests
{
    [Fact]
    public async Task CreateEventAsync_ShouldCreateWeeklySeries_WhenRecurrenceUntilIsSet()
    {
        var userId = Guid.NewGuid();
        var eventRepository = new InMemoryCalendarEventRepository();
        var service = CreateService(eventRepository, userId);

        await service.CreateEventAsync(new CreateCalendarEventRequest(
            Title: "Sport",
            Description: null,
            StartUtc: new DateTimeOffset(2026, 06, 01, 18, 00, 00, TimeSpan.Zero),
            EndUtc: new DateTimeOffset(2026, 06, 01, 19, 00, 00, TimeSpan.Zero),
            AllDay: false,
            Recurrence: CalendarRecurrenceFrequency.Weekly,
            RecurrenceInterval: 1,
            RecurrenceUntilUtc: new DateTimeOffset(2026, 06, 22, 18, 00, 00, TimeSpan.Zero)));

        eventRepository.Items.Should().HaveCount(4);
        eventRepository.Items.Select(x => x.StartUtc).Should().Equal(
            new DateTimeOffset(2026, 06, 01, 18, 00, 00, TimeSpan.Zero),
            new DateTimeOffset(2026, 06, 08, 18, 00, 00, TimeSpan.Zero),
            new DateTimeOffset(2026, 06, 15, 18, 00, 00, TimeSpan.Zero),
            new DateTimeOffset(2026, 06, 22, 18, 00, 00, TimeSpan.Zero));
    }

    [Fact]
    public async Task CreateEventAsync_ShouldClampMonthlySeriesToLastDay_WhenTargetMonthIsShorter()
    {
        var userId = Guid.NewGuid();
        var eventRepository = new InMemoryCalendarEventRepository();
        var service = CreateService(eventRepository, userId);

        await service.CreateEventAsync(new CreateCalendarEventRequest(
            Title: "Monatsabschluss",
            Description: null,
            StartUtc: new DateTimeOffset(2026, 01, 31, 10, 00, 00, TimeSpan.Zero),
            EndUtc: new DateTimeOffset(2026, 01, 31, 11, 00, 00, TimeSpan.Zero),
            AllDay: false,
            Recurrence: CalendarRecurrenceFrequency.Monthly,
            RecurrenceInterval: 1,
            RecurrenceCount: 3));

        eventRepository.Items.Select(x => x.StartUtc).Should().Equal(
            new DateTimeOffset(2026, 01, 31, 10, 00, 00, TimeSpan.Zero),
            new DateTimeOffset(2026, 02, 28, 10, 00, 00, TimeSpan.Zero),
            new DateTimeOffset(2026, 03, 31, 10, 00, 00, TimeSpan.Zero));
    }

    [Fact]
    public async Task CreateEventAsync_ShouldThrow_WhenRecurrenceBoundaryIsMissing()
    {
        var userId = Guid.NewGuid();
        var eventRepository = new InMemoryCalendarEventRepository();
        var service = CreateService(eventRepository, userId);

        var action = async () => await service.CreateEventAsync(new CreateCalendarEventRequest(
            Title: "Serie ohne Ende",
            Description: null,
            StartUtc: new DateTimeOffset(2026, 06, 01, 18, 00, 00, TimeSpan.Zero),
            EndUtc: new DateTimeOffset(2026, 06, 01, 19, 00, 00, TimeSpan.Zero),
            AllDay: false,
            Recurrence: CalendarRecurrenceFrequency.Weekly,
            RecurrenceInterval: 1));

        await action.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*end date or recurrence count*");
    }

    private static CalendarService CreateService(InMemoryCalendarEventRepository eventRepository, Guid userId)
        => new(eventRepository, new InMemoryFamilyMemberRepository(), new FakeCurrentUserProvider(userId));

    private sealed class InMemoryCalendarEventRepository : ICalendarEventRepository
    {
        public List<CalendarEvent> Items { get; } = [];

        public Task<CalendarEvent?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<CalendarEvent>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<CalendarEvent>>(Items.Where(x => x.UserId == userId).OrderBy(x => x.StartUtc).ToList());

        public Task<IReadOnlyList<CalendarEvent>> GetByUserIdsAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default)
        {
            var lookup = userIds.ToHashSet();
            return Task.FromResult<IReadOnlyList<CalendarEvent>>(Items.Where(x => lookup.Contains(x.UserId)).OrderBy(x => x.StartUtc).ToList());
        }

        public Task AddAsync(CalendarEvent calendarEvent, CancellationToken cancellationToken = default)
        {
            Items.Add(calendarEvent);
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
        {
            var removed = Items.RemoveAll(x => x.Id == id && x.UserId == userId) > 0;
            return Task.FromResult(removed);
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class InMemoryFamilyMemberRepository : IFamilyMemberRepository
    {
        public Task<FamilyMember?> GetByFamilyAndUserAsync(Guid familyId, Guid userId, CancellationToken cancellationToken = default)
            => Task.FromResult<FamilyMember?>(null);

        public Task<IReadOnlyList<FamilyMember>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<FamilyMember>>([]);

        public Task<IReadOnlyList<FamilyMember>> GetByFamilyIdWithUsersAsync(Guid familyId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<FamilyMember>>([]);

        public Task AddAsync(FamilyMember member, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task SaveChangesAsync(CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class FakeCurrentUserProvider(Guid userId) : ICurrentUserProvider
    {
        public Guid GetRequiredUserId() => userId;
    }
}
