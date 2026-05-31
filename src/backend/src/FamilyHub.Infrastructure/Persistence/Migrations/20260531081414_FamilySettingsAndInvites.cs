using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FamilySettingsAndInvites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RequiresPasswordChange",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                table: "FamilyMembers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "FamilyMembers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "FamilyMembers" AS fm
                SET "IsAdmin" = TRUE
                FROM "Families" AS f
                WHERE f."Id" = fm."FamilyId"
                  AND f."CreatedByUserId" = fm."UserId";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiresPasswordChange",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsAdmin",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "FamilyMembers");
        }
    }
}
