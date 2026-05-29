using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using FamilyHub.Application.Contracts;

namespace FamilyHub.Api.Tests;

public sealed class AuthEndpointsTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    [Fact]
    public async Task Register_ShouldCreateUserAndReturnToken()
    {
        var client = factory.CreateClient();
        var email = $"register-{Guid.NewGuid():N}@example.com";

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest(
            FirstName: "Anna",
            LastName: "Muster",
            Email: email,
            Password: "Secure123!"));
        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.User.Email.Should().Be(email);
    }

    [Fact]
    public async Task Login_ShouldReturnOkWithToken_WhenPasswordIsCorrect()
    {
        var client = factory.CreateClient();
        var email = $"login-{Guid.NewGuid():N}@example.com";
        const string password = "Secure123!";

        await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest("Anna", "Muster", email, password));

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginUserRequest(email, password));
        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenPasswordIsWrong()
    {
        var client = factory.CreateClient();
        var email = $"wrong-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest("Anna", "Muster", email, "Secure123!"));

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginUserRequest(email, "WrongPassword!"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenEmailAlreadyExists()
    {
        var client = factory.CreateClient();
        var email = $"dup-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest("Anna", "Muster", email, "Secure123!"));

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest("Anna", "Muster", email, "Secure123!"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
