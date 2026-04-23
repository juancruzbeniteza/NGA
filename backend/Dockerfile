# Etapa de compilación (Contexto: backend/)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar y restaurar (el contexto es la carpeta backend)
COPY ["backend.csproj", "./"]
RUN dotnet restore "backend.csproj"

# Publicar
COPY . .
RUN dotnet publish "backend.csproj" -c Release -o /app/publish

# Etapa final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Solución al error 139
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# Configuración de puerto para Render
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "backend.dll"]
