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
    public async Task AddMember_ShouldReturnCreated_WhenUserExists()
    {
        var (clientA, _) = await CreateAuthenticatedClientAsync();
        var emailB = $"memberb-{Guid.NewGuid():N}@example.com";
        var clientB = factory.CreateClient();
        await clientB.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest("Bob", "Muster", emailB, "Secure123!"));

        var familyResponse = await clientA.PostAsJsonAsync("/api/families", new CreateFamilyRequest("Test Familie"));
        var family = await familyResponse.Content.ReadFromJsonAsync<FamilyDto>(JsonOptions);

        var response = await clientA.PostAsJsonAsync($"/api/families/{family!.Id}/members", new AddFamilyMemberRequest(emailB));

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
