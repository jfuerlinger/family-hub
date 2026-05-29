using Microsoft.EntityFrameworkCore;
using FamilyHub.Domain.Models;

namespace FamilyHub.Infrastructure.Persistence;

public sealed class FamilyHubDbContext(DbContextOptions<FamilyHubDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<TodoItem> TodoItems => Set<TodoItem>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FamilyHubDbContext).Assembly);
    }
}
