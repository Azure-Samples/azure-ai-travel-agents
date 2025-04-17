var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddMcpServer()
                .WithHttpTransport()
                .WithToolsFromAssembly();

builder.Services.AddProblemDetails();

var app = builder.Build();

app.MapDefaultEndpoints();
app.MapMcp();

await app.RunAsync();
