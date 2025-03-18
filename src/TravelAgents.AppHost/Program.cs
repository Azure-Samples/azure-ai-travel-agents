var builder = DistributedApplication.CreateBuilder(args);

var ui = builder.AddDockerfile("ui", "../ui");

builder.Build().Run();
