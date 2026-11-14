# Multi-stage build for Spring Boot on Render
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build jar
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/chat-backend-*.jar app.jar

# Render assigns PORT dynamically
ENV PORT=8080
EXPOSE 8080

# Run with memory limit suitable for Render free tier (512MB)
CMD ["sh", "-c", "java -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar app.jar"]
