var builder = DistributedApplication.CreateBuilder(args);

var postgresPassword = builder.AddParameter("postgres-password", "postgres", secret: true);
const string developmentJwtSigningKey = "familyhub-development-only-jwt-signing-key-not-for-production";

var postgres = builder.AddPostgres("postgres", password: postgresPassword)
    .WithDataVolume("familyhub-postgres-data")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin(pgAdmin => pgAdmin.WithLifetime(ContainerLifetime.Persistent));

var familyhubDb = postgres.AddDatabase("familyhubdb");

var api = builder.AddProject<Projects.FamilyHub_Api>("api")
    .WithHttpEndpoint(name: "http")
    .WithReference(familyhubDb)
    .WithEnvironment("Authentication__Jwt__SigningKey", developmentJwtSigningKey)
    .WaitFor(familyhubDb);

builder.AddViteApp("frontend", "../../../frontend")
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();
