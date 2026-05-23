FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Mirath.API/Mirath.API.csproj", "Mirath.API/"]
COPY ["Mirath.Application/Mirath.Application.csproj", "Mirath.Application/"]
COPY ["Mirath.Domain/Mirath.Domain.csproj", "Mirath.Domain/"]
COPY ["Mirath.Infrastructure/Mirath.Infrastructure.csproj", "Mirath.Infrastructure/"]
COPY ["Mirath.Shared/Mirath.Shared.csproj", "Mirath.Shared/"]
RUN dotnet restore "Mirath.API/Mirath.API.csproj"
COPY . .
WORKDIR "/src/Mirath.API"
RUN dotnet build "Mirath.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Mirath.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Mirath.API.dll"]
