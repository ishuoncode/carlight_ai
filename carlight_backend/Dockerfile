FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY target/carlight.jar carlight.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","carlight.jar"]
