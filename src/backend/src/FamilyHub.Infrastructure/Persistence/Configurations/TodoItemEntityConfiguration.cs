using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FamilyHub.Domain.Models;

namespace FamilyHub.Infrastructure.Persistence.Configurations;

internal sealed class TodoItemEntityConfiguration : IEntityTypeConfiguration<TodoItem>
{
    public void Configure(EntityTypeBuilder<TodoItem> builder)
    {
        builder.ToTable("TodoItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FamilyId).IsRequired();
        builder.Property(x => x.CreatedByUserId).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.IsDone).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
    }
}
