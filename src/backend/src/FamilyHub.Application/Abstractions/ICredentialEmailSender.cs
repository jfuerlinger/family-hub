using FamilyHub.Application.Contracts;

namespace FamilyHub.Application.Abstractions;

public interface ICredentialEmailSender
{
    Task SendFamilyInviteAsync(FamilyInviteMessage message, CancellationToken cancellationToken = default);
}
