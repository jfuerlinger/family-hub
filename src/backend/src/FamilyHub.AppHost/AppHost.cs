var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume("familyhub-postgres-data")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin(pgAdmin => pgAdmin.WithLifetime(ContainerLifetime.Persistent));

var familyhubDb = postgres.AddDatabase("familyhubdb");

var api = builder.AddProject<Projects.FamilyHub_Api>("api")
    .WithReference(familyhubDb)
    .WaitFor(familyhubDb);

builder.AddViteApp("frontend", "../../../frontend")
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();
