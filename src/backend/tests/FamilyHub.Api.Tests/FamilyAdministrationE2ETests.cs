using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using FamilyHub.Application.Contracts;

namespace FamilyHub.Api.Tests;

public sealed class FamilyAdministrationE2ETests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    [Fact]
    public async Task InviteFlow_ShouldRequirePasswordChange_BeforeMemberCanUseProtectedFamilyEndpoints()
    {
        var adminClient = factory.CreateClient();
        var adminEmail = $"admin-{Guid.NewGuid():N}@example.com";
        var registerResponse = await adminClient.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterUserRequest("Anna", "Admin", adminEmail, "Secure123!"));
        var adminAuth = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        adminClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminAuth!.AccessToken);

        var familyCreateResponse = await adminClient.PostAsJsonAsync("/api/families", new CreateFamilyRequest("Familie E2E"));
        var family = await familyCreateResponse.Content.ReadFromJsonAsync<FamilyDto>(JsonOptions);

        var memberEmail = $"member-{Guid.NewGuid():N}@example.com";
        var addMemberResponse = await adminClient.PostAsJsonAsync(
            $"/api/families/{family!.Id}/members",
            new AddFamilyMemberRequest("Max", "Mitglied", memberEmail, "01234", false));
        var addedMember = await addMemberResponse.Content.ReadFromJsonAsync<FamilyMemberDto>(JsonOptions);

        var temporaryPassword = factory.CredentialEmailSender.Messages
            .Single(message => message.RecipientEmail == memberEmail)
            .TemporaryPassword;

        var memberClient = factory.CreateClient();
        var loginResponse = await memberClient.PostAsJsonAsync(
            "/api/auth/login",
            new LoginUserRequest(memberEmail, temporaryPassword));
        var invitedAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);

        invitedAuth!.User.RequiresPasswordChange.Should().BeTrue();
        memberClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", invitedAuth.AccessToken);

        var blockedResponse = await memberClient.GetAsync("/api/families");
        blockedResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var changePasswordResponse = await memberClient.PostAsJsonAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest(temporaryPassword, "Changed123!"));
        var changedAuth = await changePasswordResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        changedAuth!.User.RequiresPasswordChange.Should().BeFalse();
        memberClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", changedAuth.AccessToken);

        var memberFamiliesResponse = await memberClient.GetAsync("/api/families");
        memberFamiliesResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        await adminClient.PutAsJsonAsync(
            $"/api/families/{family.Id}/members/{addedMember!.Id}",
            new UpdateFamilyMemberRequest("Max", "Mitglied", memberEmail, "01234", true));

        var renamedFamilyResponse = await memberClient.PutAsJsonAsync(
            $"/api/families/{family.Id}",
            new UpdateFamilyRequest("Familie E2E Neu"));
        var renamedFamily = await renamedFamilyResponse.Content.ReadFromJsonAsync<FamilyDto>(JsonOptions);

        renamedFamilyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        renamedFamily!.Name.Should().Be("Familie E2E Neu");
    }
}
