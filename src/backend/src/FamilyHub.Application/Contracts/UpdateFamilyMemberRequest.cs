namespace FamilyHub.Application.Contracts;

public sealed record UpdateFamilyMemberRequest(
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber = null,
    bool IsAdmin = false);
