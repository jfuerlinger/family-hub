using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Services;

public sealed class AuthService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    ICurrentUserProvider currentUserProvider) : IAuthService
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default)
    {
        ValidateNames(request.FirstName, request.LastName);
        ValidatePassword(request.Password);

        var normalizedEmail = User.NormalizeEmail(request.Email);
        var existing = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is not null)
            throw new ArgumentException("A user with this email already exists.", nameof(request.Email));

        var hashedPassword = passwordHasher.Hash(request.Password);
        var user = User.Create(
            request.FirstName,
            request.LastName,
            normalizedEmail,
            hashedPassword.HashBase64,
            hashedPassword.SaltBase64,
            hashedPassword.Iterations);

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        var authToken = tokenService.CreateToken(user);
        return ToAuthResponse(user, authToken);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginUserRequest request, CancellationToken cancellationToken = default)
    {
        ValidatePassword(request.Password);

        var normalizedEmail = User.NormalizeEmail(request.Email);
        var user = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null)
            throw new UnauthorizedAccessException("Email or password is invalid.");

        var verified = passwordHasher.Verify(
            request.Password,
            new PasswordHashResult(user.PasswordHash, user.PasswordSalt, user.PasswordIterations));

        if (!verified)
            throw new UnauthorizedAccessException("Email or password is invalid.");

        var authToken = tokenService.CreateToken(user);
        return ToAuthResponse(user, authToken);
    }

    public async Task<AuthResponseDto> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        ValidatePassword(request.CurrentPassword);
        ValidatePassword(request.NewPassword);

        var userId = currentUserProvider.GetRequiredUserId();
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Authenticated user does not exist.");

        var validCurrentPassword = passwordHasher.Verify(
            request.CurrentPassword,
            new PasswordHashResult(user.PasswordHash, user.PasswordSalt, user.PasswordIterations));

        if (!validCurrentPassword)
            throw new UnauthorizedAccessException("Current password is invalid.");

        var newPasswordHash = passwordHasher.Hash(request.NewPassword);
        user.UpdatePassword(
            newPasswordHash.HashBase64,
            newPasswordHash.SaltBase64,
            newPasswordHash.Iterations,
            requiresPasswordChange: false);
        await userRepository.SaveChangesAsync(cancellationToken);

        var authToken = tokenService.CreateToken(user);
        return ToAuthResponse(user, authToken);
    }

    private static AuthResponseDto ToAuthResponse(User user, AuthTokenResult authToken)
    {
        return new AuthResponseDto(
            authToken.AccessToken,
            authToken.ExpiresAtUtc,
            new AuthenticatedUserDto(user.Id, user.FirstName, user.LastName, user.Email, user.RequiresPasswordChange));
    }

    private static void ValidateNames(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("First name is required.", nameof(firstName));
        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Last name is required.", nameof(lastName));
    }

    private static void ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password is required.", nameof(password));
        if (password.Length < 8)
            throw new ArgumentException("Password must have at least 8 characters.", nameof(password));
    }
}
