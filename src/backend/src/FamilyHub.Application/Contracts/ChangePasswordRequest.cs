namespace FamilyHub.Application.Contracts;

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);
