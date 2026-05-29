using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FamilyHub.Application.Contracts;
using FamilyHub.Application.Services;

namespace FamilyHub.Api.Controllers;

[ApiController]
[Authorize]
public sealed class CalendarController(ICalendarService calendarService) : ControllerBase
{
    [HttpGet("api/events")]
    [ProducesResponseType(typeof(IReadOnlyList<CalendarEventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CalendarEventDto>>> GetMyEvents(CancellationToken cancellationToken)
    {
        var result = await calendarService.GetMyEventsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("api/families/{familyId:guid}/events")]
    [ProducesResponseType(typeof(IReadOnlyList<FamilyCalendarEventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FamilyCalendarEventDto>>> GetFamilyEvents(Guid familyId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await calendarService.GetFamilyEventsAsync(familyId, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("api/events")]
    [ProducesResponseType(typeof(CalendarEventDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CalendarEventDto>> Create([FromBody] CreateCalendarEventRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await calendarService.CreateEventAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(detail: ex.Message);
        }
    }

    [HttpDelete("api/events/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await calendarService.DeleteEventAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
