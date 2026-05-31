using FamilyHub.Application.Abstractions;
using FamilyHub.Domain.Models;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Infrastructure.Seeding;

public static class FamilyHubDataSeeder
{
    private const string DemoUserFirstName = "Anna";
    private const string DemoUserLastName = "Muster";
    private const string DemoUserEmail = "demo@familyhub.local";
    public const string DemoUserPassword = "Demo1234!";

    public static async Task SeedAsync(FamilyHubDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        if (dbContext.Users.Any())
            return;

        await ForceSeedAsync(dbContext, passwordHasher, cancellationToken);
    }

    public static async Task ForceSeedAsync(FamilyHubDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        var demoUser = await EnsureDemoUserAsync(dbContext, passwordHasher, cancellationToken);

        // Create a demo family
        if (!dbContext.Families.Any())
        {
            var family = Family.Create("Muster Familie", demoUser.Id);
            await dbContext.Families.AddAsync(family, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            var member = FamilyMember.Create(family.Id, demoUser.Id, "#4f46e5", isAdmin: true);
            await dbContext.FamilyMembers.AddAsync(member, cancellationToken);

            // Add some demo todos
            var todos = new[]
            {
                TodoItem.Create(family.Id, demoUser.Id, "Einkaufen gehen", "Milch, Brot, Eier", demoUser.Id),
                TodoItem.Create(family.Id, demoUser.Id, "Arzttermin vereinbaren", null, null),
                TodoItem.Create(family.Id, demoUser.Id, "Auto zum TÜV bringen", "Termin: nächsten Monat", demoUser.Id),
            };
            todos[0].MarkAsDone();
            await dbContext.TodoItems.AddRangeAsync(todos, cancellationToken);

            // Add some demo calendar events
            var now = DateTimeOffset.UtcNow;
            var events = new[]
            {
                CalendarEvent.Create(demoUser.Id, "Geburtstag Papa", null, now.AddDays(7), now.AddDays(7).AddHours(2)),
                CalendarEvent.Create(demoUser.Id, "Familienausflug", "Wanderung am Wochenende", now.AddDays(14), now.AddDays(14).AddHours(6)),
            };
            await dbContext.CalendarEvents.AddRangeAsync(events, cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task<User> EnsureDemoUserAsync(FamilyHubDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken)
    {
        var normalizedEmail = User.NormalizeEmail(DemoUserEmail);
        var existingUser = dbContext.Users.SingleOrDefault(x => x.Email == normalizedEmail);
        if (existingUser is not null)
            return existingUser;

        var hashedPassword = passwordHasher.Hash(DemoUserPassword);
        var user = User.Create(
            DemoUserFirstName,
            DemoUserLastName,
            normalizedEmail,
            hashedPassword.HashBase64,
            hashedPassword.SaltBase64,
            hashedPassword.Iterations);

        await dbContext.Users.AddAsync(user, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }
}
