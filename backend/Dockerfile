FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -ntp verify
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S portal && adduser -S portal -G portal
WORKDIR /app
COPY --from=build --chown=portal:portal /workspace/target/student-clone-0.1.0.jar app.jar
USER portal
ENV SERVER_ADDRESS=0.0.0.0
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
