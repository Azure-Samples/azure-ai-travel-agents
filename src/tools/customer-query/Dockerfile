# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY ["AITravelAgent.CustomerQueryServer/AITravelAgent.CustomerQueryServer.csproj", "AITravelAgent.CustomerQueryServer/"]
RUN dotnet restore "AITravelAgent.CustomerQueryServer/AITravelAgent.CustomerQueryServer.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR /app/AITravelAgent.CustomerQueryServer
# Build and publish the app
RUN dotnet publish "AITravelAgent.CustomerQueryServer.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AITravelAgent.CustomerQueryServer.dll"]