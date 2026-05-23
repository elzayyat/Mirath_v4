using MediatR;
using Microsoft.EntityFrameworkCore;
using Mirath.Domain.Exceptions;
using Mirath.Application.Features.Auth.DTOs;
using Mirath.Application.Features.Auth.Commands;
using Mirath.Infrastructure.Persistence;

namespace Mirath.Application.Features.Auth.Queries;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserDto>;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserDto>
{
    private readonly ApplicationDbContext _context;

    public GetCurrentUserQueryHandler(ApplicationDbContext context) => _context = context;

    public async Task<UserDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.AsNoTracking()
                       .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
                   ?? throw new NotFoundException("User not found");

        var subscription = await AuthDtoMapper.ActiveSubscriptionQuery(
                _context.UserSubscriptions.AsNoTracking().Include(x => x.Plan),
                user.Id)
            .FirstOrDefaultAsync(cancellationToken);

        return new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            user.Status,
            user.AuthProvider,
            user.IsEmailVerified,
            user.IsTwoFactorEnabled,
            user.DefaultMadhab,
            user.Language,
            subscription);
    }
}
