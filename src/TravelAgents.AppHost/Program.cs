using TravelAgents.AppHost;

var builder = DistributedApplication.CreateBuilder(args);

var echoAgent = builder.AddNpmApp("echo", "../agents/echo-agent")
    .WithNodeDefaults()
    .PublishAsDockerFile()
    .WithNpmPackageInstallation()
    .WithHttpEndpoint(env: "PORT")
    .WithMcpHealthCheck();

var api = builder.AddNpmApp("api", "../api")
    .WithNodeDefaults()
    .PublishAsDockerFile()
    .WithNpmPackageInstallation()
    .WithReference(echoAgent)
    .WaitFor(echoAgent);

var ui = builder.AddDockerfile("ui", "../ui");

builder.Build().Run();
