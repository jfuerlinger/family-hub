using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Abstractions;

public interface ITokenService
{
    AuthTokenResult CreateToken(User user);
}
