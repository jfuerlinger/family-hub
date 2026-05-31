using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Services;
using FamilyHub.Infrastructure.Persistence;
using FamilyHub.Infrastructure.Persistence.Repositories;
using FamilyHub.Infrastructure.Notifications;
using FamilyHub.Infrastructure.Security;
using FamilyHub.Infrastructure.Seeding;

namespace FamilyHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("familyhubdb")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("No database connection string configured (expected 'familyhubdb' or 'DefaultConnection').");

        services.AddDbContext<FamilyHubDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IUserRepository, EfUserRepository>();
        services.AddScoped<IFamilyRepository, EfFamilyRepository>();
        services.AddScoped<IFamilyMemberRepository, EfFamilyMemberRepository>();
        services.AddScoped<ITodoRepository, EfTodoRepository>();
        services.AddScoped<ICalendarEventRepository, EfCalendarEventRepository>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddScoped<ICredentialEmailSender, LoggingCredentialEmailSender>();

        return services;
    }

    public static async Task EnsureDatabaseInitializedAsync(this IServiceProvider services, bool seed = false, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FamilyHubDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        if (dbContext.Database.IsRelational())
            await dbContext.Database.MigrateAsync(cancellationToken);
        else
            await dbContext.Database.EnsureCreatedAsync(cancellationToken);

        if (seed)
            await FamilyHubDataSeeder.SeedAsync(dbContext, passwordHasher, cancellationToken);
    }

    public static async Task ResetDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FamilyHubDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await dbContext.Database.EnsureDeletedAsync(cancellationToken);
        await dbContext.Database.MigrateAsync(cancellationToken);
        await FamilyHubDataSeeder.ForceSeedAsync(dbContext, passwordHasher, cancellationToken);
    }
}
