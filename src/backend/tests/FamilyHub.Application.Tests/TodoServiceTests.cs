using FluentAssertions;
using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Application.Services;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Tests;

public sealed class TodoServiceTests
{
    [Fact]
    public async Task CreateTodoAsync_ShouldCreateTodo_WhenUserIsMember()
    {
        var familyId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var memberRepo = new InMemoryFamilyMemberRepository();
        memberRepo.Items.Add(FamilyMember.Create(familyId, userId));
        var todoRepo = new InMemoryTodoRepository();
        var userProvider = new FakeCurrentUserProvider(userId);

        var service = new TodoService(todoRepo, memberRepo, userProvider);

        var result = await service.CreateTodoAsync(familyId, new CreateTodoRequest("Einkaufen", null, null));

        result.Title.Should().Be("Einkaufen");
        result.FamilyId.Should().Be(familyId);
        todoRepo.Items.Should().ContainSingle();
    }

    [Fact]
    public async Task MarkAsDoneAsync_ShouldMarkTodoAsDone()
    {
        var familyId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var memberRepo = new InMemoryFamilyMemberRepository();
        memberRepo.Items.Add(FamilyMember.Create(familyId, userId));
        var todoRepo = new InMemoryTodoRepository();
        var todo = TodoItem.Create(familyId, userId, "Test", null, null);
        todoRepo.Items.Add(todo);
        var userProvider = new FakeCurrentUserProvider(userId);

        var service = new TodoService(todoRepo, memberRepo, userProvider);
        var result = await service.MarkAsDoneAsync(familyId, todo.Id);

        result.Should().NotBeNull();
        result!.IsDone.Should().BeTrue();
    }

    private sealed class InMemoryFamilyMemberRepository : IFamilyMemberRepository
    {
        public List<FamilyMember> Items { get; } = [];

        public Task<FamilyMember?> GetByFamilyAndUserAsync(Guid familyId, Guid userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.FamilyId == familyId && x.UserId == userId));

        public Task<IReadOnlyList<FamilyMember>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<FamilyMember>>(Items.Where(x => x.FamilyId == familyId).ToList());

        public Task<IReadOnlyList<FamilyMember>> GetByFamilyIdWithUsersAsync(Guid familyId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<FamilyMember>>(Items.Where(x => x.FamilyId == familyId).ToList());

        public Task AddAsync(FamilyMember member, CancellationToken cancellationToken = default)
        {
            Items.Add(member);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class InMemoryTodoRepository : ITodoRepository
    {
        public List<TodoItem> Items { get; } = [];

        public Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<TodoItem>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<TodoItem>>(Items.Where(x => x.FamilyId == familyId).ToList());

        public Task AddAsync(TodoItem todo, CancellationToken cancellationToken = default)
        {
            Items.Add(todo);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeCurrentUserProvider(Guid userId) : ICurrentUserProvider
    {
        public Guid GetRequiredUserId() => userId;
    }
}
