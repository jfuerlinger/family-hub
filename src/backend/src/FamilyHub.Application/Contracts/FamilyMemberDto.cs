namespace FamilyHub.Application.Contracts;

public sealed record FamilyMemberDto(
    Guid Id,
    Guid UserId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    bool IsAdmin,
    string Color,
    DateTimeOffset JoinedAtUtc);
