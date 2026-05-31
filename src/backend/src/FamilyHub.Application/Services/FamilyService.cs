using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Services;

public sealed class FamilyService(
    IFamilyRepository familyRepository,
    IFamilyMemberRepository familyMemberRepository,
    IUserRepository userRepository,
    ICurrentUserProvider currentUserProvider,
    IPasswordHasher passwordHasher,
    ICredentialEmailSender credentialEmailSender) : IFamilyService
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

        var member = FamilyMember.Create(family.Id, userId, isAdmin: true);
        await familyMemberRepository.AddAsync(member, cancellationToken);
        await familyMemberRepository.SaveChangesAsync(cancellationToken);

        return new FamilyDto(
            family.Id,
            family.Name,
            family.CreatedByUserId,
            family.CreatedAtUtc,
            [ToMemberDto(member, creator)]);
    }

    public async Task<FamilyDto> UpdateFamilyAsync(Guid familyId, UpdateFamilyRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Family name is required.", nameof(request.Name));

        var family = await familyRepository.GetByIdAsync(familyId, cancellationToken)
            ?? throw new KeyNotFoundException($"Family {familyId} not found.");

        await EnsureCurrentUserIsAdminAsync(familyId, cancellationToken);

        family.Rename(request.Name);
        await familyRepository.SaveChangesAsync(cancellationToken);

        return await BuildFamilyDtoAsync(family, cancellationToken);
    }

    public async Task<IReadOnlyList<FamilyDto>> GetMyFamiliesAsync(CancellationToken cancellationToken = default)
    {
        var userId = currentUserProvider.GetRequiredUserId();
        var families = await familyRepository.GetByUserIdAsync(userId, cancellationToken);
        var result = new List<FamilyDto>();
        foreach (var family in families)
        {
            result.Add(await BuildFamilyDtoAsync(family, cancellationToken));
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

        return await BuildFamilyDtoAsync(family, cancellationToken);
    }

    public async Task<FamilyMemberDto> AddMemberAsync(Guid familyId, AddFamilyMemberRequest request, CancellationToken cancellationToken = default)
    {
        var family = await familyRepository.GetByIdAsync(familyId, cancellationToken)
            ?? throw new KeyNotFoundException($"Family {familyId} not found.");

        await EnsureCurrentUserIsAdminAsync(familyId, cancellationToken);
        ValidateNames(request.FirstName, request.LastName);
        var normalizedEmail = User.NormalizeEmail(request.Email);

        var existingUser = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existingUser is not null)
            throw new ArgumentException("A user with this email already exists.", nameof(request.Email));

        var temporaryPassword = RandomPasswordGenerator.Generate();
        var hashedPassword = passwordHasher.Hash(temporaryPassword);
        var userToAdd = User.Create(
            request.FirstName,
            request.LastName,
            normalizedEmail,
            hashedPassword.HashBase64,
            hashedPassword.SaltBase64,
            hashedPassword.Iterations,
            requiresPasswordChange: true);

        await userRepository.AddAsync(userToAdd, cancellationToken);

        var member = FamilyMember.Create(
            familyId,
            userToAdd.Id,
            color: request.Color,
            phoneNumber: request.PhoneNumber,
            isAdmin: request.IsAdmin);
        await familyMemberRepository.AddAsync(member, cancellationToken);
        await familyMemberRepository.SaveChangesAsync(cancellationToken);

        await credentialEmailSender.SendFamilyInviteAsync(
            new FamilyInviteMessage(userToAdd.Email, userToAdd.FirstName, family.Name, temporaryPassword),
            cancellationToken);

        return ToMemberDto(member, userToAdd);
    }

    public async Task<FamilyMemberDto> UpdateMemberAsync(
        Guid familyId,
        Guid memberId,
        UpdateFamilyMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(familyId, cancellationToken);
        ValidateNames(request.FirstName, request.LastName);
        var normalizedEmail = User.NormalizeEmail(request.Email);

        var member = await familyMemberRepository.GetByIdAsync(memberId, cancellationToken)
            ?? throw new KeyNotFoundException($"Family member {memberId} not found.");
        if (member.FamilyId != familyId)
            throw new KeyNotFoundException($"Family member {memberId} not found in family {familyId}.");

        var user = await userRepository.GetByIdAsync(member.UserId, cancellationToken)
            ?? throw new KeyNotFoundException($"No user found for member {memberId}.");
        if (!string.Equals(user.Email, normalizedEmail, StringComparison.Ordinal))
        {
            var existingUser = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
            if (existingUser is not null && existingUser.Id != user.Id)
                throw new ArgumentException("A user with this email already exists.", nameof(request.Email));
        }

        user.UpdateProfile(request.FirstName, request.LastName, normalizedEmail);
        member.UpdatePhoneNumber(request.PhoneNumber);

        if (member.IsAdmin && !request.IsAdmin)
        {
            var familyMembers = await familyMemberRepository.GetByFamilyIdAsync(familyId, cancellationToken);
            var adminCount = familyMembers.Count(existingMember => existingMember.IsAdmin);
            if (adminCount <= 1)
                throw new InvalidOperationException("A family must always have at least one admin.");
        }

        member.SetAdmin(request.IsAdmin);

        await familyMemberRepository.SaveChangesAsync(cancellationToken);
        return ToMemberDto(member, user);
    }

    private async Task EnsureCurrentUserIsAdminAsync(Guid familyId, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserProvider.GetRequiredUserId();
        var currentMembership = await familyMemberRepository.GetByFamilyAndUserAsync(familyId, currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("You are not a member of this family.");

        if (!currentMembership.IsAdmin)
            throw new UnauthorizedAccessException("Only admins can manage family settings.");
    }

    private async Task<FamilyDto> BuildFamilyDtoAsync(Family family, CancellationToken cancellationToken)
    {
        var members = await familyMemberRepository.GetByFamilyIdWithUsersAsync(family.Id, cancellationToken);
        var memberDtos = new List<FamilyMemberDto>();
        foreach (var member in members)
        {
            User? user = member.User;
            if (user is null)
            {
                user = await userRepository.GetByIdAsync(member.UserId, cancellationToken);
            }

            if (user is not null)
            {
                memberDtos.Add(ToMemberDto(member, user));
            }
        }

        return new FamilyDto(family.Id, family.Name, family.CreatedByUserId, family.CreatedAtUtc, memberDtos);
    }

    private static void ValidateNames(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("First name is required.", nameof(firstName));
        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Last name is required.", nameof(lastName));
    }

    private static FamilyMemberDto ToMemberDto(FamilyMember member, User user)
    {
        return new FamilyMemberDto(
            member.Id,
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            member.PhoneNumber,
            member.IsAdmin,
            member.Color,
            member.JoinedAtUtc);
    }
}
