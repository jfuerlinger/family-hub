using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Abstractions;

public interface ITodoRepository
{
    Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TodoItem>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task AddAsync(TodoItem todo, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
