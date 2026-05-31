using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FamilyHub.Application.Contracts;
using FamilyHub.Application.Services;

namespace FamilyHub.Api.Controllers;

[ApiController]
[Route("api/families")]
[Authorize]
public sealed class FamiliesController(IFamilyService familyService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<FamilyDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FamilyDto>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await familyService.GetMyFamiliesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(FamilyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FamilyDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await familyService.GetFamilyAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(FamilyDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FamilyDto>> Create([FromBody] CreateFamilyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await familyService.CreateFamilyAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(detail: ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(FamilyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FamilyDto>> Update(Guid id, [FromBody] UpdateFamilyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await familyService.UpdateFamilyAsync(id, request, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Detail = ex.Message });
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

    [HttpPost("{id:guid}/members")]
    [ProducesResponseType(typeof(FamilyMemberDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FamilyMemberDto>> AddMember(Guid id, [FromBody] AddFamilyMemberRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var member = await familyService.AddMemberAsync(id, request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id }, member);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Detail = ex.Message });
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

    [HttpPut("{id:guid}/members/{memberId:guid}")]
    [ProducesResponseType(typeof(FamilyMemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FamilyMemberDto>> UpdateMember(Guid id, Guid memberId, [FromBody] UpdateFamilyMemberRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var member = await familyService.UpdateMemberAsync(id, memberId, request, cancellationToken);
            return Ok(member);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails { Detail = ex.Message });
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
}
