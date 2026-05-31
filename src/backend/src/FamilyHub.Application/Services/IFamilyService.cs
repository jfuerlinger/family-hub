using FamilyHub.Application.Contracts;

namespace FamilyHub.Application.Services;

public interface IFamilyService
{
    Task<FamilyDto> CreateFamilyAsync(CreateFamilyRequest request, CancellationToken cancellationToken = default);
    Task<FamilyDto> UpdateFamilyAsync(Guid familyId, UpdateFamilyRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FamilyDto>> GetMyFamiliesAsync(CancellationToken cancellationToken = default);
    Task<FamilyDto?> GetFamilyAsync(Guid familyId, CancellationToken cancellationToken = default);
    Task<FamilyMemberDto> AddMemberAsync(Guid familyId, AddFamilyMemberRequest request, CancellationToken cancellationToken = default);
    Task<FamilyMemberDto> UpdateMemberAsync(Guid familyId, Guid memberId, UpdateFamilyMemberRequest request, CancellationToken cancellationToken = default);
}
