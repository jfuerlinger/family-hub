using Microsoft.EntityFrameworkCore;
using FamilyHub.Application.Abstractions;
using FamilyHub.Domain.Models;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Infrastructure.Persistence.Repositories;

internal sealed class EfFamilyRepository(FamilyHubDbContext dbContext) : IFamilyRepository
{
    public Task<Family?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Families.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Family?> GetByIdWithMembersAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Families
            .Include(f => f.Members)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Family>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var familyIds = await dbContext.FamilyMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.FamilyId)
            .ToListAsync(cancellationToken);

        return await dbContext.Families
            .Where(f => familyIds.Contains(f.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Family family, CancellationToken cancellationToken = default)
        => await dbContext.Families.AddAsync(family, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
