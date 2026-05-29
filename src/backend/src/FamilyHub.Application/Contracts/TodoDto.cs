namespace FamilyHub.Application.Contracts;

public sealed record TodoDto(
    Guid Id,
    Guid FamilyId,
    Guid CreatedByUserId,
    Guid? AssignedToUserId,
    string Title,
    string? Description,
    bool IsDone,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? DueDateUtc,
    DateTimeOffset? CompletedAtUtc);
