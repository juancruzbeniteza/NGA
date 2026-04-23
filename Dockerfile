# Etapa de compilación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar y restaurar
COPY ["backend/backend.csproj", "backend/"]
RUN dotnet restore "backend/backend.csproj"

# Publicar
COPY backend/ ./backend/
WORKDIR "/src/backend"
RUN dotnet publish "backend.csproj" -c Release -o /app/publish

# Etapa final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# SOLUCIÓN DEFINITIVA AL ERROR 139
# Desactivamos la dependencia de librerías nativas de globalización
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# Configuración de puerto para Render
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "backend.dll"]
