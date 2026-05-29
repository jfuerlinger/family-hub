using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Services;

public sealed class TodoService(
    ITodoRepository todoRepository,
    IFamilyMemberRepository familyMemberRepository,
    ICurrentUserProvider currentUserProvider) : ITodoService
{
    public async Task<TodoDto> CreateTodoAsync(Guid familyId, CreateTodoRequest request, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        await EnsureMembershipAsync(familyId, userId, cancellationToken);

        var todo = TodoItem.Create(familyId, userId, request.Title, request.Description, request.AssignedToUserId, request.DueDateUtc);
        await todoRepository.AddAsync(todo, cancellationToken);
        await todoRepository.SaveChangesAsync(cancellationToken);

        return ToDto(todo);
    }

    public async Task<IReadOnlyList<TodoDto>> GetTodosAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        await EnsureMembershipAsync(familyId, userId, cancellationToken);

        var todos = await todoRepository.GetByFamilyIdAsync(familyId, cancellationToken);
        return todos.Select(ToDto).ToList();
    }

    public async Task<TodoDto?> MarkAsDoneAsync(Guid familyId, Guid todoId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        await EnsureMembershipAsync(familyId, userId, cancellationToken);

        var todo = await todoRepository.GetByIdAsync(todoId, cancellationToken);
        if (todo is null || todo.FamilyId != familyId)
            return null;

        todo.MarkAsDone();
        await todoRepository.SaveChangesAsync(cancellationToken);
        return ToDto(todo);
    }

    public async Task<TodoDto?> MarkAsPendingAsync(Guid familyId, Guid todoId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        await EnsureMembershipAsync(familyId, userId, cancellationToken);

        var todo = await todoRepository.GetByIdAsync(todoId, cancellationToken);
        if (todo is null || todo.FamilyId != familyId)
            return null;

        todo.MarkAsPending();
        await todoRepository.SaveChangesAsync(cancellationToken);
        return ToDto(todo);
    }

    private async Task EnsureMembershipAsync(Guid familyId, Guid userId, CancellationToken cancellationToken)
    {
        var membership = await familyMemberRepository.GetByFamilyAndUserAsync(familyId, userId, cancellationToken);
        if (membership is null)
            throw new UnauthorizedAccessException("You are not a member of this family.");
    }

    private static TodoDto ToDto(TodoItem todo)
    {
        return new TodoDto(
            todo.Id,
            todo.FamilyId,
            todo.CreatedByUserId,
            todo.AssignedToUserId,
            todo.Title,
            todo.Description,
            todo.IsDone,
            todo.CreatedAtUtc,
            todo.DueDateUtc,
            todo.CompletedAtUtc);
    }
}
