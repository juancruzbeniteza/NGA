# Etapa de compilación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar el proyecto usando la ruta relativa desde la raíz
COPY ["backend/backend.csproj", "backend/"]
RUN dotnet restore "backend/backend.csproj"

# Copiar todo el contenido de la carpeta backend
COPY backend/ ./backend/
WORKDIR "/src/backend"
RUN dotnet publish "backend.csproj" -c Release -o /app/publish

# Etapa final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# SOLUCIÓN AL ERROR 139: Instalar librerías de globalización
RUN apt-get update && apt-get install -y libicu-dev
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# Configuración de puerto para Render
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "backend.dll"]
