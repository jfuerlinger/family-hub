using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Api.Tests;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"familyhub-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            var dbName = _dbName;
            services.Replace(ServiceDescriptor.Scoped<FamilyHubDbContext>(_ =>
            {
                var opts = new DbContextOptionsBuilder<FamilyHubDbContext>()
                    .UseInMemoryDatabase(dbName)
                    .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                    .Options;
                return new FamilyHubDbContext(opts);
            }));
        });
    }
}
