using Microsoft.AspNetCore.Mvc;
using Mirath.Application.Common.Models;

namespace Mirath.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult<T> Ok<T>(T data, string message = "Success") =>
        base.Ok(new ApiResponse<T>(true, data, message));

    protected ActionResult<T> Created<T>(string uri, T data, string message = "Created successfully") =>
        base.Created(uri, new ApiResponse<T>(true, data, message));

    protected ActionResult BadRequest(string message, Dictionary<string, string[]>? errors = null) =>
        base.BadRequest(new ApiResponse<object>(false, null, message, errors));

    protected ActionResult NotFound(string message = "Resource not found") =>
        base.NotFound(new ApiResponse<object>(false, null, message));

    protected ActionResult Unauthorized(string message = "Unauthorized access") =>
        base.Unauthorized(new ApiResponse<object>(false, null, message));

    protected ActionResult Forbidden(string message = "Access denied") =>
        base.StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<object>(false, null, message));

    protected Guid CurrentUserId => Guid.Parse(User.FindFirst("userId")?.Value ?? throw new UnauthorizedAccessException());
    protected string CurrentUserRole => User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? string.Empty;
}
