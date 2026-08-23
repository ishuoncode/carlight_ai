# ============================================================
# Stage 1 — Build the jar with Maven inside Docker
# ============================================================
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Cache dependencies first for faster rebuilds
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Build the application (skip tests — they need DB access)
COPY src ./src
RUN mvn -B clean package -DskipTests

# ============================================================
# Stage 2 — Slim runtime image
# ============================================================
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Run as non-root user (security best practice)
RUN useradd --system --uid 1001 carlight
USER carlight

# Prod profile baked in; Render env vars can still override anything
ENV SPRING_PROFILES_ACTIVE=prod \
    SERVER_PORT=8080 \
    JAVA_OPTS=""

COPY --from=build /app/target/carlight.jar app.jar

EXPOSE 8080

# Render injects $PORT, but Spring reads SERVER_PORT so keep default 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

