# --- client: Vite builds into ../WebDirListing/wwwroot
FROM docker.io/library/node:24-slim AS client
WORKDIR /src/client
COPY src/client/package.json src/client/package-lock.json ./
RUN npm ci
COPY src/client/ ./
RUN npm run build

# --- server
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src/WebDirListing
COPY src/WebDirListing/WebDirListing.csproj ./
RUN dotnet restore
COPY src/WebDirListing/ ./
COPY --from=client /src/WebDirListing/wwwroot ./wwwroot
RUN dotnet publish -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .
RUN mkdir -p /state && chown app:app /state

ENV ASPNETCORE_HTTP_PORTS=8080 \
    Library__StateDir=/state

# Media libraries, mount read-only. Configure with Library__Paths__<Name>=/data/<folder>
VOLUME /data
# SQLite database (listening/reading progress). Must be writable by the app user.
VOLUME /state

EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "WebDirListing.dll"]
