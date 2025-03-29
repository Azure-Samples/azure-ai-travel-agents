FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (will be cached if no changes)
RUN mvn dependency:go-offline

# Copy source files and build the application
COPY src ./src
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy jar from the build stage
COPY --from=build /app/target/travel-data-1.0-SNAPSHOT.jar ./app.jar

# Define environment variables
ENV PORT=5008

EXPOSE ${PORT}

# Run the application
CMD ["java", "-jar", "app.jar"]