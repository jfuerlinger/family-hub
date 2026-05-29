using FamilyHub.Application.Contracts;

namespace FamilyHub.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginUserRequest request, CancellationToken cancellationToken = default);
}
