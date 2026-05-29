namespace FamilyHub.Application.Abstractions;

public sealed record AuthTokenResult(string AccessToken, DateTimeOffset ExpiresAtUtc);
