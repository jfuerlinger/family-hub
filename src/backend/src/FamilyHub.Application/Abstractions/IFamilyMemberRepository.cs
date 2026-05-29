using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Abstractions;

public interface IFamilyMemberRepository
{
    Task<FamilyMember?> GetByFamilyAndUserAsync(Guid familyId, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FamilyMember>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FamilyMember>> GetByFamilyIdWithUsersAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task AddAsync(FamilyMember member, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
