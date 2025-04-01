# Build stage
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only the POM file first to cache dependencies
COPY pom.xml ./
# Download dependencies - this layer will be cached unless pom.xml changes
RUN mvn dependency:go-offline

# Now copy the source code (which changes more frequently)
COPY src ./src/

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
# Copy the built artifact from the build stage
COPY --from=build /app/target/mcp-echo-starter-webflux-server-0.0.1-SNAPSHOT.jar /app/application.jar
# Expose the port your application runs on
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "/app/application.jar"]