using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Services;

public sealed class FamilyService(
    IFamilyRepository familyRepository,
    IFamilyMemberRepository familyMemberRepository,
    IUserRepository userRepository,
    ICurrentUserProvider currentUserProvider) : IFamilyService
{
    public async Task<FamilyDto> CreateFamilyAsync(CreateFamilyRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Family name is required.", nameof(request.Name));

        var userId = currentUserProvider.GetRequiredUserId();
        var family = Family.Create(request.Name, userId);
        await familyRepository.AddAsync(family, cancellationToken);

        // Add creator as first member
        var creator = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("Current user not found.");

        var member = FamilyMember.Create(family.Id, userId);
        await familyMemberRepository.AddAsync(member, cancellationToken);
        await familyMemberRepository.SaveChangesAsync(cancellationToken);

        return new FamilyDto(
            family.Id,
            family.Name,
            family.CreatedByUserId,
            family.CreatedAtUtc,
            [ToMemberDto(member, creator)]);
    }

    public async Task<IReadOnlyList<FamilyDto>> GetMyFamiliesAsync(CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        var families = await familyRepository.GetByUserIdAsync(userId, cancellationToken);
        var result = new List<FamilyDto>();
        foreach (var family in families)
        {
            var members = await familyMemberRepository.GetByFamilyIdAsync(family.Id, cancellationToken);
            var memberDtos = new List<FamilyMemberDto>();
            foreach (var m in members)
            {
                var user = await userRepository.GetByIdAsync(m.UserId, cancellationToken);
                if (user is not null)
                    memberDtos.Add(ToMemberDto(m, user));
            }
            result.Add(new FamilyDto(family.Id, family.Name, family.CreatedByUserId, family.CreatedAtUtc, memberDtos));
        }
        return result;
    }

    public async Task<FamilyDto?> GetFamilyAsync(Guid familyId, CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        var family = await familyRepository.GetByIdAsync(familyId, cancellationToken);
        if (family is null)
            return null;

        // Check membership
        var membership = await familyMemberRepository.GetByFamilyAndUserAsync(familyId, userId, cancellationToken);
        if (membership is null)
            return null;

        var members = await familyMemberRepository.GetByFamilyIdAsync(familyId, cancellationToken);
        var memberDtos = new List<FamilyMemberDto>();
        foreach (var m in members)
        {
            var user = await userRepository.GetByIdAsync(m.UserId, cancellationToken);
            if (user is not null)
                memberDtos.Add(ToMemberDto(m, user));
        }

        return new FamilyDto(family.Id, family.Name, family.CreatedByUserId, family.CreatedAtUtc, memberDtos);
    }

    public async Task<FamilyMemberDto> AddMemberAsync(Guid familyId, AddFamilyMemberRequest request, CancellationToken cancellationToken = default)
    {
        var currentUserId = currentUserProvider.GetRequiredUserId();

        var family = await familyRepository.GetByIdAsync(familyId, cancellationToken)
            ?? throw new KeyNotFoundException($"Family {familyId} not found.");

        // Must be a member of the family to add others
        var currentMembership = await familyMemberRepository.GetByFamilyAndUserAsync(familyId, currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("You are not a member of this family.");

        var normalizedEmail = User.NormalizeEmail(request.Email);
        var userToAdd = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken)
            ?? throw new KeyNotFoundException($"No user found with email '{request.Email}'.");

        // Check if already a member
        var existing = await familyMemberRepository.GetByFamilyAndUserAsync(familyId, userToAdd.Id, cancellationToken);
        if (existing is not null)
            throw new ArgumentException("This user is already a member of the family.");

        var member = FamilyMember.Create(familyId, userToAdd.Id, request.Color);
        await familyMemberRepository.AddAsync(member, cancellationToken);
        await familyMemberRepository.SaveChangesAsync(cancellationToken);

        return ToMemberDto(member, userToAdd);
    }

    private static FamilyMemberDto ToMemberDto(FamilyMember member, User user)
    {
        return new FamilyMemberDto(member.Id, user.Id, user.FirstName, user.LastName, user.Email, member.Color, member.JoinedAtUtc);
    }
}
