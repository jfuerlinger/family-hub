using FluentAssertions;
using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Application.Services;
using FamilyHub.Domain.Models;

namespace FamilyHub.Application.Tests;

public sealed class FamilyServiceTests
{
    [Fact]
    public async Task CreateFamilyAsync_ShouldCreateFamilyAndAdminMembership()
    {
        var creator = User.Create("Anna", "Muster", "anna@example.com", "hash", "salt", 100_000);
        var userRepository = new InMemoryUserRepository([creator]);
        var familyRepository = new InMemoryFamilyRepository();
        var memberRepository = new InMemoryFamilyMemberRepository();
        var currentUserProvider = new FakeCurrentUserProvider(creator.Id);
        var service = new FamilyService(
            familyRepository,
            memberRepository,
            userRepository,
            currentUserProvider,
            new FakePasswordHasher(),
            new FakeCredentialEmailSender());

        var result = await service.CreateFamilyAsync(new CreateFamilyRequest("Muster Familie"));

        result.Name.Should().Be("Muster Familie");
        result.Members.Should().ContainSingle();
        result.Members[0].IsAdmin.Should().BeTrue();
    }

    [Fact]
    public async Task AddMemberAsync_ShouldCreateUserWithTemporaryPasswordAndInvite()
    {
        var creator = User.Create("Anna", "Muster", "anna@example.com", "hash", "salt", 100_000);
        var family = Family.Create("Muster Familie", creator.Id);
        var userRepository = new InMemoryUserRepository([creator]);
        var familyRepository = new InMemoryFamilyRepository([family]);
        var memberRepository = new InMemoryFamilyMemberRepository([FamilyMember.Create(family.Id, creator.Id, isAdmin: true)]);
        var emailSender = new FakeCredentialEmailSender();
        var service = new FamilyService(
            familyRepository,
            memberRepository,
            userRepository,
            new FakeCurrentUserProvider(creator.Id),
            new FakePasswordHasher(),
            emailSender);

        var result = await service.AddMemberAsync(
            family.Id,
            new AddFamilyMemberRequest("Lisa", "Muster", "lisa@example.com", "1234", true));

        result.Email.Should().Be("lisa@example.com");
        result.PhoneNumber.Should().Be("1234");
        result.IsAdmin.Should().BeTrue();
        userRepository.Items.Should().ContainSingle(user => user.Email == "lisa@example.com" && user.RequiresPasswordChange);
        emailSender.Messages.Should().ContainSingle(message => message.RecipientEmail == "lisa@example.com");
    }

    [Fact]
    public async Task AddMemberAsync_ShouldThrow_WhenCurrentUserIsNotAdmin()
    {
        var creator = User.Create("Anna", "Muster", "anna@example.com", "hash", "salt", 100_000);
        var family = Family.Create("Muster Familie", creator.Id);
        var userRepository = new InMemoryUserRepository([creator]);
        var familyRepository = new InMemoryFamilyRepository([family]);
        var memberRepository = new InMemoryFamilyMemberRepository([FamilyMember.Create(family.Id, creator.Id, isAdmin: false)]);
        var service = new FamilyService(
            familyRepository,
            memberRepository,
            userRepository,
            new FakeCurrentUserProvider(creator.Id),
            new FakePasswordHasher(),
            new FakeCredentialEmailSender());

        var action = async () => await service.AddMemberAsync(
            family.Id,
            new AddFamilyMemberRequest("Lisa", "Muster", "lisa@example.com"));

        await action.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task UpdateMemberAsync_ShouldChangeMemberData_WhenCurrentUserIsAdmin()
    {
        var creator = User.Create("Anna", "Muster", "anna@example.com", "hash", "salt", 100_000);
        var memberUser = User.Create("Lisa", "Alt", "lisa@example.com", "hash", "salt", 100_000, requiresPasswordChange: true);
        var family = Family.Create("Muster Familie", creator.Id);
        var adminMembership = FamilyMember.Create(family.Id, creator.Id, isAdmin: true);
        var member = FamilyMember.Create(family.Id, memberUser.Id, phoneNumber: "111", isAdmin: false);

        var userRepository = new InMemoryUserRepository([creator, memberUser]);
        var familyRepository = new InMemoryFamilyRepository([family]);
        var memberRepository = new InMemoryFamilyMemberRepository([adminMembership, member]);
        var service = new FamilyService(
            familyRepository,
            memberRepository,
            userRepository,
            new FakeCurrentUserProvider(creator.Id),
            new FakePasswordHasher(),
            new FakeCredentialEmailSender());

        var result = await service.UpdateMemberAsync(
            family.Id,
            member.Id,
            new UpdateFamilyMemberRequest("Lisa", "Neu", "lisa.neu@example.com", "222", true));

        result.LastName.Should().Be("Neu");
        result.Email.Should().Be("lisa.neu@example.com");
        result.PhoneNumber.Should().Be("222");
        result.IsAdmin.Should().BeTrue();
    }

    private sealed class FakePasswordHasher : IPasswordHasher
    {
        public PasswordHashResult Hash(string password) => new($"hash-{password}", "salt-value", 100_000);
        public bool Verify(string password, PasswordHashResult hashedPassword) => hashedPassword.HashBase64 == $"hash-{password}";
    }

    private sealed class FakeCredentialEmailSender : ICredentialEmailSender
    {
        public List<FamilyInviteMessage> Messages { get; } = [];

        public Task SendFamilyInviteAsync(FamilyInviteMessage message, CancellationToken cancellationToken = default)
        {
            Messages.Add(message);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCurrentUserProvider(Guid userId) : ICurrentUserProvider
    {
        public Guid GetRequiredUserId() => userId;
    }

    private sealed class InMemoryFamilyRepository : IFamilyRepository
    {
        public InMemoryFamilyRepository(IEnumerable<Family>? items = null)
        {
            if (items is not null)
            {
                Items.AddRange(items);
            }
        }

        public List<Family> Items { get; } = [];

        public Task<Family?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.Id == id));

        public Task<Family?> GetByIdWithMembersAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<Family>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Family>>(Items.ToList());

        public Task AddAsync(Family family, CancellationToken cancellationToken = default)
        {
            Items.Add(family);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class InMemoryFamilyMemberRepository : IFamilyMemberRepository
    {
        public InMemoryFamilyMemberRepository(IEnumerable<FamilyMember>? items = null)
        {
            if (items is not null)
            {
                Items.AddRange(items);
            }
        }

        public List<FamilyMember> Items { get; } = [];

        public Task<FamilyMember?> GetByIdAsync(Guid memberId, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.Id == memberId));

        public Task<FamilyMember?> GetByFamilyAndUserAsync(Guid familyId, Guid userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Items.SingleOrDefault(x => x.FamilyId == familyId && x.UserId == userId));

        public Task<IReadOnlyList<FamilyMember>> GetByFamilyIdAsync(Guid familyId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<FamilyMember>>(Items.Where(x => x.FamilyId == familyId).ToList());

        public Task<IReadOnlyList<FamilyMember>> GetByFamilyIdWithUsersAsync(Guid familyId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<FamilyMember>>(Items.Where(x => x.FamilyId == familyId).ToList());

        public Task AddAsync(FamilyMember member, CancellationToken cancellationToken = default)
        {
            Items.Add(member);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class InMemoryUserRepository : IUserRepository
    {
        public InMemoryUserRepository(IEnumerable<User>? items = null)
        {
            if (items is not null)
            {
                Items.AddRange(items);
            }
        }

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
}
