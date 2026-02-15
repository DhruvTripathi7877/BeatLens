# ═══════════════════════════════════════════════════════════════
# BeatLens Backend — Multi-stage Docker Build
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build with Maven ──
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml first for dependency layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source and build the fat JAR (skip tests — CI runs them separately)
COPY src/ src/
RUN ./mvnw package -DskipTests -B

# ── Stage 2: Lightweight Runtime ──
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S beatlens && adduser -S beatlens -G beatlens

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Switch to non-root user
USER beatlens

# Default port (Railway overrides via PORT env var)
ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
