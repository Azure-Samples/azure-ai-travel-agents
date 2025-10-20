FROM node:22-alpine

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm install -g @angular/cli

RUN npm install

# Serve in development mode to use environment.development.ts with localhost:4000
CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check", "--configuration", "development"]
