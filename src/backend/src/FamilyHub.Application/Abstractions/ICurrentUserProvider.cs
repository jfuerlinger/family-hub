namespace FamilyHub.Application.Abstractions;

public interface ICurrentUserProvider
{
    Guid GetRequiredUserId();
}
