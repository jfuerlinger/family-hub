using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace FamilyHub.Api.Authentication;

public sealed class PasswordChangeRequiredMiddleware(RequestDelegate next)
{
    private static readonly HashSet<PathString> AllowedPaths =
    [
        new PathString("/api/auth/change-password")
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            await next(context);
            return;
        }

        var requiresPasswordChangeClaim = context.User.FindFirst("pwd_change_required")?.Value;
        if (!string.Equals(requiresPasswordChangeClaim, "true", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        if (AllowedPaths.Contains(context.Request.Path))
        {
            await next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = "Password change required",
            Detail = "You must change your temporary password before accessing this endpoint.",
        };

        problemDetails.Extensions["code"] = "PASSWORD_CHANGE_REQUIRED";
        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
    }
}
