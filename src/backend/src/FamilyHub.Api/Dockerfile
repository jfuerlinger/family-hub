FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/FamilyHub.Api/FamilyHub.Api.csproj", "src/FamilyHub.Api/"]
COPY ["src/FamilyHub.Application/FamilyHub.Application.csproj", "src/FamilyHub.Application/"]
COPY ["src/FamilyHub.Domain/FamilyHub.Domain.csproj", "src/FamilyHub.Domain/"]
COPY ["src/FamilyHub.Infrastructure/FamilyHub.Infrastructure.csproj", "src/FamilyHub.Infrastructure/"]
COPY ["src/FamilyHub.ServiceDefaults/FamilyHub.ServiceDefaults.csproj", "src/FamilyHub.ServiceDefaults/"]
RUN dotnet restore "src/FamilyHub.Api/FamilyHub.Api.csproj"

COPY . .
RUN dotnet publish "src/FamilyHub.Api/FamilyHub.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "FamilyHub.Api.dll"]
