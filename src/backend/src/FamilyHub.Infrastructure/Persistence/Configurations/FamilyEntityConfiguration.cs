using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FamilyHub.Domain.Models;

namespace FamilyHub.Infrastructure.Persistence.Configurations;

internal sealed class FamilyEntityConfiguration : IEntityTypeConfiguration<Family>
{
    public void Configure(EntityTypeBuilder<Family> builder)
    {
        builder.ToTable("Families");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.CreatedByUserId).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.HasMany(x => x.Members)
            .WithOne(x => x.Family)
            .HasForeignKey(x => x.FamilyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
