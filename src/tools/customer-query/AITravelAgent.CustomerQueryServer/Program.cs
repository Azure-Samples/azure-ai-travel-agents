using AITravelAgent.CustomerQueryServer;
using ModelContextProtocol;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services
    .AddMcpServer()
    .WithTools();

builder.Services.AddProblemDetails();

var app = builder.Build();

app.MapGet("/", () => "Hello World!");
app.MapDefaultEndpoints();
app.MapMcpSse();

await app.RunAsync();
