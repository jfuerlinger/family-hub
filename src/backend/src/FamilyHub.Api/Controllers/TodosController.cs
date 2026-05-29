using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FamilyHub.Application.Contracts;
using FamilyHub.Application.Services;

namespace FamilyHub.Api.Controllers;

[ApiController]
[Route("api/families/{familyId:guid}/todos")]
[Authorize]
public sealed class TodosController(ITodoService todoService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TodoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TodoDto>>> GetAll(Guid familyId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await todoService.GetTodosAsync(familyId, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(TodoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TodoDto>> Create(Guid familyId, [FromBody] CreateTodoRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await todoService.CreateTodoAsync(familyId, request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(detail: ex.Message);
        }
    }

    [HttpPatch("{todoId:guid}/done")]
    [ProducesResponseType(typeof(TodoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TodoDto>> MarkAsDone(Guid familyId, Guid todoId, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await todoService.MarkAsDoneAsync(familyId, todoId, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPatch("{todoId:guid}/pending")]
    [ProducesResponseType(typeof(TodoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TodoDto>> MarkAsPending(Guid familyId, Guid todoId, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await todoService.MarkAsPendingAsync(familyId, todoId, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
