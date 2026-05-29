using FamilyHub.Application.Contracts;

namespace FamilyHub.Application.Services;

public interface ITodoService
{
    Task<TodoDto> CreateTodoAsync(Guid familyId, CreateTodoRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TodoDto>> GetTodosAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task<TodoDto?> MarkAsDoneAsync(Guid familyId, Guid todoId, CancellationToken cancellationToken = default);
    Task<TodoDto?> MarkAsPendingAsync(Guid familyId, Guid todoId, CancellationToken cancellationToken = default);
}
