namespace FamilyHub.Application.Contracts;

public sealed record CreateTodoRequest(
    string Title,
    string? Description,
    Guid? AssignedToUserId,
    DateTimeOffset? DueDateUtc = null);
