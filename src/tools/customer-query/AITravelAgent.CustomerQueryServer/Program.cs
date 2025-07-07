var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddMcpServer()
                .WithHttpTransport(o => o.Stateless = true)
                .WithToolsFromAssembly();

builder.Services.AddProblemDetails();

var app = builder.Build();

app.MapDefaultEndpoints();
app.MapMcp("/mcp");

await app.RunAsync();
