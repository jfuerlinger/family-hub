using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using FamilyHub.Application.Abstractions;
using FamilyHub.Application.Contracts;
using FamilyHub.Infrastructure.Persistence;

namespace FamilyHub.Api.Tests;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"familyhub-tests-{Guid.NewGuid():N}";
    public TestCredentialEmailSender CredentialEmailSender { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            var dbName = _dbName;
            CredentialEmailSender.Clear();

            services.Replace(ServiceDescriptor.Scoped<FamilyHubDbContext>(_ =>
            {
                var opts = new DbContextOptionsBuilder<FamilyHubDbContext>()
                    .UseInMemoryDatabase(dbName)
                    .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                    .Options;
                return new FamilyHubDbContext(opts);
            }));

            services.Replace(ServiceDescriptor.Scoped<ICredentialEmailSender>(_ => CredentialEmailSender));
        });
    }

    public sealed class TestCredentialEmailSender : ICredentialEmailSender
    {
        private readonly List<FamilyInviteMessage> _messages = [];
        private readonly object _syncRoot = new();

        public IReadOnlyList<FamilyInviteMessage> Messages
        {
            get
            {
                lock (_syncRoot)
                {
                    return _messages.ToList();
                }
            }
        }

        public Task SendFamilyInviteAsync(FamilyInviteMessage message, CancellationToken cancellationToken = default)
        {
            lock (_syncRoot)
            {
                _messages.Add(message);
            }

            return Task.CompletedTask;
        }

        public void Clear()
        {
            lock (_syncRoot)
            {
                _messages.Clear();
            }
        }
    }
}
