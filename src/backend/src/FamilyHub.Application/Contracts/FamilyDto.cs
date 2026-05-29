namespace FamilyHub.Application.Contracts;

public sealed record FamilyDto(
    Guid Id,
    string Name,
    Guid CreatedByUserId,
    DateTimeOffset CreatedAtUtc,
    IReadOnlyList<FamilyMemberDto> Members);
