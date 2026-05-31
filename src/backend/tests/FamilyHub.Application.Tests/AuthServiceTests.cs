using FluentAssertions;
using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Application.Services;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_ShouldCreateUserAndReturnToken()
    {
        var repository = new InMemoryUserRepository();
        var service = new AuthService(repository, new FakePasswordHasher(), new FakeTokenService(), new FakeCurrentUserProvider(Guid.NewGuid()));
        var credential = $"Auth-{Guid.NewGuid():N}!";

        var result = await service.RegisterAsync(new RegisterUserRequest(
            FirstName: "Anna",
            LastName: "Muster",
            Email: "Anna@Example.com",
            Password: credential));

        result.AccessToken.Should().Be("token-value");
        result.User.Email.Should().Be("anna@example.com");
        result.User.RequiresPasswordChange.Should().BeFalse();
        repository.Items.Should().ContainSingle();
    }

    [Fact]
    public async Task RegisterAsync_ShouldThrow_WhenEmailAlreadyExists()
    {
        var repository = new InMemoryUserRepository();
        var service = new AuthService(repository, new FakePasswordHasher(), new FakeTokenService(), new FakeCurrentUserProvider(Guid.NewGuid()));
        var credential = $"Auth-{Guid.NewGuid():N}!";

        await service.RegisterAsync(new RegisterUserRequest("Anna", "Muster", "anna@example.com", credential));

        var action = async () => await service.RegisterAsync(new RegisterUserRequest("Anna", "Muster", "anna@example.com", credential));
        await action.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task LoginAsync_ShouldThrowUnauthorized_WhenPasswordDoesNotMatch()
    {
        var repository = new InMemoryUserRepository();
        var validCredential = $"Auth-{Guid.NewGuid():N}!";
        var wrongCredential = $"Mismatch-{Guid.NewGuid():N}!";
        repository.Items.Add(User.Create(
            firstName: "Anna",
            lastName: "Muster",
            email: "anna@example.com",
            passwordHash: $"hash-{validCredential}",
            passwordSalt: "salt-value",
            passwordIterations: 100_000));

        var service = new AuthService(repository, new FakePasswordHasher(), new FakeTokenService(), new FakeCurrentUserProvider(Guid.NewGuid()));

        var action = async () => await service.LoginAsync(new LoginUserRequest(
            Email: "anna@example.com",
            Password: wrongCredential));

        await action.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnToken_WhenCredentialsAreValid()
    {
        var repository = new InMemoryUserRepository();
        const string password = "Secure123!";
        var service = new AuthService(repository, new FakePasswordHasher(), new FakeTokenService(), new FakeCurrentUserProvider(Guid.NewGuid()));

        await service.RegisterAsync(new RegisterUserRequest("Anna", "Muster", "anna@example.com", password));
        var result = await service.LoginAsync(new LoginUserRequest("anna@example.com", password));

        result.AccessToken.Should().Be("token-value");
        result.User.Email.Should().Be("anna@example.com");
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldUpdatePasswordAndClearRequiredFlag()
    {
        var repository = new InMemoryUserRepository();
        var hasher = new FakePasswordHasher();
        repository.Items.Add(User.Create(
            firstName: "Anna",
            lastName: "Muster",
            email: "anna@example.com",
            passwordHash: "hash-OldPassword123!",
            passwordSalt: "salt-value",
            passwordIterations: 100_000,
            requiresPasswordChange: true));

        var user = repository.Items[0];
        var currentUserProvider = new FakeCurrentUserProvider(user.Id);
        var service = new AuthService(repository, hasher, new FakeTokenService(), currentUserProvider);

        var result = await service.ChangePasswordAsync(new ChangePasswordRequest("OldPassword123!", "NewPassword123!"));

        result.User.RequiresPasswordChange.Should().BeFalse();
        user.RequiresPasswordChange.Should().BeFalse();
        user.PasswordHash.Should().Be("hash-NewPassword123!");
    }

    [Fact]
    public async Task ChangePasswordAsync_ShouldThrowUnauthorized_WhenCurrentPasswordIsInvalid()
    {
        var repository = new InMemoryUserRepository();
        repository.Items.Add(User.Create(
            firstName: "Anna",
            lastName: "Muster",
            email: "anna@example.com",
            passwordHash: "hash-OldPassword123!",
            passwordSalt: "salt-value",
            passwordIterations: 100_000,
            requiresPasswordChange: true));

        var user = repository.Items[0];
        var service = new AuthService(
            repository,
            new FakePasswordHasher(),
            new FakeTokenService(),
            new FakeCurrentUserProvider(user.Id));

        var action = async () => await service.ChangePasswordAsync(new ChangePasswordRequest("WrongPassword123!", "NewPassword123!"));

        await action.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    private sealed class FakePasswordHasher : IPasswordHasher
    {
        public PasswordHashResult Hash(string password) => new($"hash-{password}", "salt-value", 100_000);
        public bool Verify(string password, PasswordHashResult hashedPassword) => hashedPassword.HashBase64 == $"hash-{password}";
    }

    private sealed class FakeTokenService : ITokenService
    {
        public AuthTokenResult CreateToken(User user) =>
            new("token-value", new DateTimeOffset(2099, 1, 1, 0, 0, 0, TimeSpan.Zero));
    }

    private sealed class InMemoryUserRepository : IUserRepository
    {
        public List<User> Items { get; } = [];

        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.Email == email));

        public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.Id == id));

        public Task AddAsync(User user, CancellationToken cancellationToken = default)
        {
            Items.Add(user);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeCurrentUserProvider(Guid userId) : ICurrentUserProvider
    {
        public Guid GetRequiredUserId() => userId;
    }
}
