sudo apt-get update && \
    sudo apt upgrade -y && \
    sudo apt-get install -y dos2unix libsecret-1-0 xdg-utils libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libxcb1 libxkbcommon0 libpango-1.0-0 libcairo2 libasound2 build-essential && \
    sudo apt clean -y && \
    sudo rm -rf /var/lib/apt/lists/*

echo Preparing .NET environment...
dotnet tool update -g linux-dev-certs
dotnet linux-dev-certs install
sudo dotnet workload update

# TODO: Uncomment the following when Foundy Local is available for Linux
# See https://github.com/microsoft/Foundry-Local/issues/80
# echo Preparing Foundry Local environment...
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# echo >> /home/vscode/.bashrc
# echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> /home/vscode/.bashrc
# eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
# brew install --build-from-source glibc
# brew tap microsoft/foundrylocal
# brew install foundrylocal

echo Done!
