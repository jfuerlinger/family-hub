using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Abstractions;

public interface IFamilyRepository
{
    Task<Family?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Family?> GetByIdWithMembersAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Family>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Family family, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
