using Microsoft.Extensions.Logging;
using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;

namespace FamilyHub.Infrastructure.Notifications;

internal sealed class LoggingCredentialEmailSender(ILogger<LoggingCredentialEmailSender> logger) : ICredentialEmailSender
{
    public Task SendFamilyInviteAsync(FamilyInviteMessage message, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Family invite sent to {Email} for family {FamilyName}.",
            message.RecipientEmail,
            message.FamilyName);

        return Task.CompletedTask;
    }
}
