namespace FamilyHub.Application.Contracts;

public sealed record AddFamilyMemberRequest(
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber = null,
    bool IsAdmin = false,
    string? Color = null);
