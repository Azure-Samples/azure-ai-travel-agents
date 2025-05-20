FROM node:22.12-alpine AS builder

RUN apk add --update python3 make g++\
   && rm -rf /var/cache/apk/*

# Install Homebrew which is needed for Foundry Local: https://github.com/microsoft/Foundry-Local
RUN /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
RUN echo >> /home/vscode/.bashrc \
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> /home/vscode/.bashrc \
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
RUN sudo apt-get install build-essential
RUN brew install --build-from-source glibc


WORKDIR /app

COPY src /app/src
COPY ./package*.json ./
COPY tsconfig.json ./tsconfig.json

RUN --mount=type=cache,target=/root/.npm npm install
RUN npm run build

FROM node:22-alpine AS release

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

RUN npm ci --ignore-scripts --omit-dev

CMD ["node", "dist/index.js"]