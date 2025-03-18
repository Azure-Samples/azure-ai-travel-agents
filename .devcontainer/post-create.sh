sudo apt-get update && \
    sudo apt upgrade -y && \
    sudo apt-get install -y dos2unix libsecret-1-0 xdg-utils libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libxcb1 libxkbcommon0 libpango-1.0-0 libcairo2 libasound2 && \
    sudo apt clean -y && \
    sudo rm -rf /var/lib/apt/lists/*

echo Preparing .NET environment...
dotnet tool update -g linux-dev-certs
dotnet linux-dev-certs install
sudo dotnet workload update

echo Done!
