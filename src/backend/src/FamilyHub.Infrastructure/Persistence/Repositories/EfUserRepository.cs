using Microsoft.EntityFrameworkCore;
using FamilyHub.Application.Abstractions;
using FamilyHub.Domain.Models;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Infrastructure.Persistence.Repositories;

internal sealed class EfUserRepository(FamilyHubDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => dbContext.Users.SingleOrDefaultAsync(x => x.Email == email, cancellationToken);

    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Users.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
        => await dbContext.Users.AddAsync(user, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
