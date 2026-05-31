namespace FamilyHub.Application.Contracts;

public sealed record FamilyInviteMessage(
    string RecipientEmail,
    string FirstName,
    string FamilyName,
    string TemporaryPassword);
