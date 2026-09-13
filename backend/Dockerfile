# Multi-stage build for Spring Boot on Render / Docker
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy gradle wrapper and config files
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# Copy source and build jar
COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy built jar from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

ENV PORT=8080
ENV TZ=Asia/Kolkata
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
