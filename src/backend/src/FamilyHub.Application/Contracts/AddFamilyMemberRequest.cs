namespace FamilyHub.Application.Contracts;

public sealed record AddFamilyMemberRequest(string Email, string? Color = null);
