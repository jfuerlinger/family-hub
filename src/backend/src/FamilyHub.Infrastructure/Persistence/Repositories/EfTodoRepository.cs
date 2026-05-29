using Microsoft.EntityFrameworkCore;
using FamilyHub.Application.Abstractions;
using FamilyHub.Domain.Models;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Infrastructure.Persistence.Repositories;

internal sealed class EfTodoRepository(FamilyHubDbContext dbContext) : ITodoRepository
{
    public Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.TodoItems.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<TodoItem>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
        => await dbContext.TodoItems
            .Where(x => x.FamilyId == familyId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(TodoItem todo, CancellationToken cancellationToken = default)
        => await dbContext.TodoItems.AddAsync(todo, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
