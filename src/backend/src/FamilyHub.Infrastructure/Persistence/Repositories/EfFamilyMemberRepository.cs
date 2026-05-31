using Microsoft.EntityFrameworkCore;
using FamilyHub.Application.Abstractions;
using FamilyHub.Domain.Models;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Infrastructure.Persistence.Repositories;

internal sealed class EfFamilyMemberRepository(FamilyHubDbContext dbContext) : IFamilyMemberRepository
{
    public Task<FamilyMember?> GetByIdAsync(Guid memberId, CancellationToken cancellationToken = default)
        => dbContext.FamilyMembers
            .Include(x => x.User)
            .SingleOrDefaultAsync(x => x.Id == memberId, cancellationToken);

    public Task<FamilyMember?> GetByFamilyAndUserAsync(Guid familyId, Guid userId, CancellationToken cancellationToken = default)
        => dbContext.FamilyMembers
            .SingleOrDefaultAsync(x => x.FamilyId == familyId && x.UserId == userId, cancellationToken);

    public async Task<IReadOnlyList<FamilyMember>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
        => await dbContext.FamilyMembers
            .Where(x => x.FamilyId == familyId)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<FamilyMember>> GetByFamilyIdWithUsersAsync(Guid familyId, CancellationToken cancellationToken = default)
        => await dbContext.FamilyMembers
            .Include(x => x.User)
            .Where(x => x.FamilyId == familyId)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(FamilyMember member, CancellationToken cancellationToken = default)
        => await dbContext.FamilyMembers.AddAsync(member, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
