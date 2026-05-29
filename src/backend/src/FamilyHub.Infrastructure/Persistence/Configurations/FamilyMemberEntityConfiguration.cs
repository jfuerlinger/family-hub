using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FamilyHub.Domain.Models;

namespace FamilyHub.Infrastructure.Persistence.Configurations;

internal sealed class FamilyMemberEntityConfiguration : IEntityTypeConfiguration<FamilyMember>
{
    public void Configure(EntityTypeBuilder<FamilyMember> builder)
    {
        builder.ToTable("FamilyMembers");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FamilyId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Color).HasMaxLength(20).IsRequired();
        builder.Property(x => x.JoinedAtUtc).IsRequired();
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.FamilyId, x.UserId }).IsUnique();
    }
}
