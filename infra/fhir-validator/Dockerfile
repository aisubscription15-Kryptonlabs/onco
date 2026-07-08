FROM node:18-alpine

# Java 17 runtime + curl for JAR download
RUN apk add --no-cache openjdk17-jre curl

WORKDIR /app

COPY package.json .
RUN npm install --production --silent

COPY server.js entrypoint.sh ./
RUN chmod +x entrypoint.sh

# JAR is downloaded into the cache volume on first startup, not baked into the image
VOLUME ["/cache"]
EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
