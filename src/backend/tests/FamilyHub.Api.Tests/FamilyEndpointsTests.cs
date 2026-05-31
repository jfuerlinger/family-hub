using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using FamilyHub.Application.Contracts;

namespace FamilyHub.Api.Tests;

public sealed class FamilyEndpointsTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private async Task<(HttpClient Client, AuthResponseDto Auth)> CreateAuthenticatedClientAsync()
    {
        var client = factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest("Anna", "Muster", email, "Secure123!"));
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        return (client, auth);
    }

    [Fact]
    public async Task CreateFamily_ShouldReturnCreated()
    {
        var (client, _) = await CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/families", new CreateFamilyRequest("Muster Familie"));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<FamilyDto>(JsonOptions);
        body!.Name.Should().Be("Muster Familie");
        body.Members.Should().ContainSingle();
    }

    [Fact]
    public async Task GetFamilies_ShouldReturnUserFamilies()
    {
        var (client, _) = await CreateAuthenticatedClientAsync();
        await client.PostAsJsonAsync("/api/families", new CreateFamilyRequest("Familie A"));

        var response = await client.GetAsync("/api/families");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var families = await response.Content.ReadFromJsonAsync<List<FamilyDto>>(JsonOptions);
        families.Should().NotBeEmpty();
    }

    [Fact]
    public async Task AddMember_ShouldReturnCreated_AndCreateInviteUser()
    {
        var (adminClient, _) = await CreateAuthenticatedClientAsync();
        var familyResponse = await adminClient.PostAsJsonAsync("/api/families", new CreateFamilyRequest("Test Familie"));
        var family = await familyResponse.Content.ReadFromJsonAsync<FamilyDto>(JsonOptions);
        var inviteEmail = $"invite-{Guid.NewGuid():N}@example.com";

        var response = await adminClient.PostAsJsonAsync(
            $"/api/families/{family!.Id}/members",
            new AddFamilyMemberRequest("Bob", "Muster", inviteEmail, "12345", false));
        var body = await response.Content.ReadFromJsonAsync<FamilyMemberDto>(JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        body.Should().NotBeNull();
        body!.Email.Should().Be(inviteEmail);
        body.PhoneNumber.Should().Be("12345");
        body.IsAdmin.Should().BeFalse();
        factory.CredentialEmailSender.Messages.Should().ContainSingle(message => message.RecipientEmail == inviteEmail);
    }

    [Fact]
    public async Task UpdateFamily_ShouldReturnForbidden_WhenCurrentUserIsNotAdmin()
    {
        var (adminClient, _) = await CreateAuthenticatedClientAsync();
        var familyResponse = await adminClient.PostAsJsonAsync("/api/families", new CreateFamilyRequest("Test Familie"));
        var family = await familyResponse.Content.ReadFromJsonAsync<FamilyDto>(JsonOptions);
        var inviteEmail = $"member-{Guid.NewGuid():N}@example.com";

        await adminClient.PostAsJsonAsync(
            $"/api/families/{family!.Id}/members",
            new AddFamilyMemberRequest("Bob", "Muster", inviteEmail, null, false));

        var memberClient = factory.CreateClient();
        var loginResponse = await memberClient.PostAsJsonAsync("/api/auth/login", new LoginUserRequest(inviteEmail, factory.CredentialEmailSender.Messages.Single(message => message.RecipientEmail == inviteEmail).TemporaryPassword));
        var memberAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        memberClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", memberAuth!.AccessToken);

        var changedPasswordResponse = await memberClient.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest(
                factory.CredentialEmailSender.Messages.Single(message => message.RecipientEmail == inviteEmail).TemporaryPassword,
                "Changed123!"));
        var changedAuth = await changedPasswordResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        memberClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", changedAuth!.AccessToken);

        var response = await memberClient.PutAsJsonAsync($"/api/families/{family.Id}", new UpdateFamilyRequest("Neuer Name"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateMember_ShouldReturnOk_WhenCurrentUserIsAdmin()
    {
        var (adminClient, _) = await CreateAuthenticatedClientAsync();
        var familyResponse = await adminClient.PostAsJsonAsync("/api/families", new CreateFamilyRequest("Test Familie"));
        var family = await familyResponse.Content.ReadFromJsonAsync<FamilyDto>(JsonOptions);
        var inviteEmail = $"member-{Guid.NewGuid():N}@example.com";

        var addResponse = await adminClient.PostAsJsonAsync(
            $"/api/families/{family!.Id}/members",
            new AddFamilyMemberRequest("Bob", "Muster", inviteEmail, "12345", false));
        var addedMember = await addResponse.Content.ReadFromJsonAsync<FamilyMemberDto>(JsonOptions);

        var response = await adminClient.PutAsJsonAsync(
            $"/api/families/{family.Id}/members/{addedMember!.Id}",
            new UpdateFamilyMemberRequest("Robert", "Muster", inviteEmail, "98765", true));
        var body = await response.Content.ReadFromJsonAsync<FamilyMemberDto>(JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body!.FirstName.Should().Be("Robert");
        body.PhoneNumber.Should().Be("98765");
        body.IsAdmin.Should().BeTrue();
    }
}
