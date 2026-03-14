# ── Stage 1: build the Spring Boot fat-jar ────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Download dependencies first (layer-cached separately from sources)
COPY pom.xml mvnw mvnw.cmd ./
COPY .mvn .mvn
RUN mvn -B dependency:go-offline -q

# Compile and package (tests skipped — run them in CI separately)
COPY src ./src
RUN mvn -B clean package -DskipTests -q

# ── Stage 2: minimal runtime image ────────────────────────────────────────────
# eclipse-temurin:21-jre-jammy is a Ubuntu 22.04 base — apt is available for
# installing Node.js.  Node is required so the JVM can spawn the
# @modelcontextprotocol/server-postgres stdio subprocess via `npx`.
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install Node.js LTS (via NodeSource) so `npx` is on PATH inside the container
RUN apt-get update -q \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Pre-cache the MCP postgres package so the first npx invocation is instant
RUN npx -y @modelcontextprotocol/server-postgres --help 2>/dev/null || true

COPY --from=builder /app/target/iam-system-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
