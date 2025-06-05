# Deployment Architecture Guide

This document provides comprehensive guidance on deploying the Azure AI Travel Agents system across different environments, from local development to production Azure Container Apps deployments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Local Development Deployment](#local-development-deployment)
3. [Docker Compose Deployment](#docker-compose-deployment)
4. [Azure Container Apps Deployment](#azure-container-apps-deployment)
5. [Infrastructure as Code](#infrastructure-as-code)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Security Configuration](#security-configuration)
8. [Scaling and Performance](#scaling-and-performance)
9. [Disaster Recovery](#disaster-recovery)
10. [Cost Optimization](#cost-optimization)

## Deployment Overview

### Deployment Environments

| Environment | Purpose | Hosting | Complexity | Cost |
|-------------|---------|---------|------------|------|
| **Local Development** | Individual development and testing | Local machine | Low | Free |
| **Docker Compose** | Team development and integration testing | Local/VM | Medium | Low |
| **Azure Container Apps** | Production and staging | Azure Cloud | High | Variable |

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Container Apps Environment                     ││
│  │ ┌─────────┐ ┌─────────┐ ┌───────────────────────────────┐ ││
│  │ │   UI    │ │   API   │ │         MCP Servers           │ ││
│  │ │  App    │ │  App    │ │ ┌─────┬─────┬─────┬─────────┐ │ ││
│  │ └─────────┘ └─────────┘ │ │Echo │CustQ│Dest │Web      │ │ ││
│  │                         │ │Ping │     │Rec  │Search...│ │ ││
│  │                         │ └─────┴─────┴─────┴─────────┘ │ ││
│  │                         └───────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Azure Services                          ││
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   ││
│  │ │Azure    │ │Container│ │ Monitor │ │    Key Vault    │   ││
│  │ │OpenAI   │ │Registry │ │(Logs/   │ │   (Secrets)     │   ││
│  │ │         │ │         │ │Metrics) │ │                 │   ││
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Local Development Deployment

### Prerequisites

```bash
# Required software
node --version    # v22.16.0+
npm --version     # 10.0.0+
docker --version  # 24.0.0+
git --version     # 2.40.0+

# Windows users only
pwsh --version    # 7.0.0+

# Azure tools
az --version      # 2.60.0+
azd version       # 1.9.0+
```

### Setup Process

#### 1. Repository Setup
```bash
# Clone repository
git clone https://github.com/Azure-Samples/azure-ai-travel-agents.git
cd azure-ai-travel-agents

# Verify repository structure
ls -la
# Expected: README.md, azure.yaml, src/, docs/, etc.
```

#### 2. Azure Authentication
```bash
# Login to Azure
azd auth login

# Alternative for GitHub Codespaces
azd auth login --use-device-code

# Verify authentication
az account show
```

#### 3. Azure Resource Provisioning
```bash
# Provision Azure resources
azd provision

# This creates:
# - Resource Group
# - Azure OpenAI Service
# - Azure Container Registry
# - Azure Container Apps Environment
# - Azure Monitor workspace
```

#### 4. Environment Configuration
```bash
# Create local environment files
cp src/api/.env.sample src/api/.env
cp src/ui/.env.sample src/ui/.env

# Edit configuration (auto-populated by azd provision)
cat src/api/.env
```

Example `.env` configuration:
```bash
# Azure Services
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini

# Bing Search
BING_SEARCH_API_KEY=your-bing-key
BING_SEARCH_ENDPOINT=https://api.bing.microsoft.com/

# MCP Server URLs (local development)
MCP_ECHO_PING_URL=http://localhost:5007
MCP_CUSTOMER_QUERY_URL=http://localhost:5001
MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002
MCP_ITINERARY_PLANNING_URL=http://localhost:5003
MCP_CODE_EVALUATION_URL=http://localhost:5004
MCP_MODEL_INFERENCE_URL=http://localhost:5005
MCP_WEB_SEARCH_URL=http://localhost:5006

# Monitoring
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:18889
OTEL_SERVICE_NAME=api-local
```

#### 5. Local Service Startup
```bash
# Terminal 1: Start API server
cd src/api
npm install
npm start
# API available at http://localhost:4000

# Terminal 2: Start UI
cd src/ui
npm install
npm start
# UI available at http://localhost:4200

# Terminal 3: Start monitoring (optional)
docker run -d \
  --name aspire-dashboard \
  -p 18888:18888 \
  -p 18889:18889 \
  -e DOTNET_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true \
  mcr.microsoft.com/dotnet/aspire-dashboard:9.1
# Dashboard available at http://localhost:18888
```

### Development Workflow

#### Hot Reload Development
```bash
# API with hot reload
cd src/api
npm run start  # Uses tsx --watch

# UI with hot reload
cd src/ui
npm run start  # Uses ng serve with watch
```

#### Testing and Validation
```bash
# Health check
curl http://localhost:4000/api/health

# Tool discovery
curl http://localhost:4000/api/tools

# Test chat (basic)
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","tools":[]}'
```

## Docker Compose Deployment

### Architecture Overview

Docker Compose provides a complete multi-container environment that closely mirrors production:

```yaml
# src/docker-compose.yml structure
services:
  aspire-dashboard:    # Monitoring
  tool-echo-ping:      # MCP servers (7 total)
  tool-customer-query:
  tool-destination-recommendation:
  tool-itinerary-planning:
  tool-code-evaluation:
  tool-model-inference:
  tool-web-search:
  web-api:            # Express API server
  web-ui:             # Angular UI
```

### Deployment Process

#### 1. Environment Preparation
```bash
cd src

# Create Docker environment files
cp api/.env.sample api/.env.docker
cp ui/.env.sample ui/.env.docker

# Configure for Docker networking
cat > api/.env.docker << EOF
# MCP Server URLs (Docker internal)
MCP_ECHO_PING_URL=http://tool-echo-ping:3000
MCP_CUSTOMER_QUERY_URL=http://tool-customer-query:8080
MCP_DESTINATION_RECOMMENDATION_URL=http://tool-destination-recommendation:8080
MCP_ITINERARY_PLANNING_URL=http://tool-itinerary-planning:8000
MCP_CODE_EVALUATION_URL=http://tool-code-evaluation:5000
MCP_MODEL_INFERENCE_URL=http://tool-model-inference:5000
MCP_WEB_SEARCH_URL=http://tool-web-search:5000

# External services (from azd provision)
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
BING_SEARCH_API_KEY=your-bing-key

# Docker-specific settings
IS_LOCAL_DOCKER_ENV=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889
EOF

cat > ui/.env.docker << EOF
NG_API_URL=http://web-api:4000
EOF
```

#### 2. Service Deployment
```bash
# Build and start all services
docker-compose up --build

# Background deployment
docker-compose up -d --build

# Check service status
docker-compose ps
```

#### 3. Service Access
```bash
# Service endpoints
echo "UI: http://localhost:4200"
echo "API: http://localhost:4000"
echo "Monitoring: http://localhost:18888"

# MCP server endpoints
echo "Echo Ping: http://localhost:5007"
echo "Customer Query: http://localhost:5001"
echo "Destination Rec: http://localhost:5002"
# ... etc
```

### Docker Compose Management

#### Service Operations
```bash
# View logs
docker-compose logs -f web-api
docker-compose logs -f tool-echo-ping

# Restart specific service
docker-compose restart web-api

# Scale services (if stateless)
docker-compose up -d --scale tool-echo-ping=2

# Rebuild single service
docker-compose build web-api
docker-compose up -d web-api
```

#### Resource Monitoring
```bash
# Resource usage
docker stats

# Service health
docker-compose exec web-api curl http://localhost:4000/api/health

# Network inspection
docker network ls
docker network inspect src_default
```

#### Troubleshooting
```bash
# Debug container issues
docker-compose exec web-api /bin/sh
docker-compose exec tool-echo-ping /bin/bash

# Check container logs
docker logs $(docker-compose ps -q web-api)

# Restart with fresh build
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Azure Container Apps Deployment

### Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resource Group                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Container Apps Environment                        ││
│  │                                                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │     UI      │  │     API     │  │     MCP Services    │ ││
│  │  │   (nginx)   │  │ (express)   │  │                     │ ││
│  │  │             │  │             │  │ ┌─────┬─────┬─────┐ │ ││
│  │  │ Replicas:   │  │ Replicas:   │  │ │Echo │CustQ│ ... │ │ ││
│  │  │   1-3       │  │   1-5       │  │ │Ping │     │     │ │ ││
│  │  │             │  │             │  │ └─────┴─────┴─────┘ │ ││
│  │  │ CPU: 0.25   │  │ CPU: 1.0    │  │ CPU: 0.5 each      │ ││
│  │  │ RAM: 0.5Gi  │  │ RAM: 2Gi    │  │ RAM: 1Gi each      │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Shared Services                           ││
│  │                                                             ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ ││
│  │ │   Azure     │ │ Container   │ │      Monitor           │ ││
│  │ │   OpenAI    │ │ Registry    │ │   (Logs, Metrics,      │ ││
│  │ │             │ │             │ │    Traces)             │ ││
│  │ └─────────────┘ └─────────────┘ └─────────────────────────┘ ││
│  │                                                             ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ ││
│  │ │ Key Vault   │ │ Managed     │ │    Storage Account      │ ││
│  │ │ (Secrets)   │ │ Identity    │ │    (Logs, Config)      │ ││
│  │ └─────────────┘ └─────────────┘ └─────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Process

#### 1. Prerequisites Verification
```bash
# Verify Azure CLI login
az account show

# Verify subscription access
az account list-locations -o table

# Check resource providers
az provider show --namespace Microsoft.App --query "registrationState"
az provider show --namespace Microsoft.ContainerRegistry --query "registrationState"
az provider show --namespace Microsoft.CognitiveServices --query "registrationState"
```

#### 2. Automated Deployment
```bash
# Deploy using Azure Developer CLI
azd up

# This process:
# 1. Provisions infrastructure (Bicep templates)
# 2. Builds container images
# 3. Pushes to Azure Container Registry
# 4. Deploys to Container Apps
# 5. Configures networking and secrets
```

#### 3. Manual Deployment Steps (Alternative)

If you need to deploy manually or understand the process:

```bash
# Step 1: Create resource group
az group create \
  --name rg-travel-agents-prod \
  --location swedencentral

# Step 2: Create Container Apps environment
az containerapp env create \
  --name cae-travel-agents \
  --resource-group rg-travel-agents-prod \
  --location swedencentral \
  --enable-workload-profiles

# Step 3: Create Azure Container Registry
az acr create \
  --name acrTravelAgents \
  --resource-group rg-travel-agents-prod \
  --sku Standard \
  --admin-enabled true

# Step 4: Build and push images
az acr build \
  --registry acrTravelAgents \
  --image travel-agents-ui:latest \
  --file src/ui/Dockerfile \
  src/ui

az acr build \
  --registry acrTravelAgents \
  --image travel-agents-api:latest \
  --file src/api/Dockerfile \
  src/api

# Step 5: Deploy container apps
az containerapp create \
  --name ca-travel-ui \
  --resource-group rg-travel-agents-prod \
  --environment cae-travel-agents \
  --image acrTravelAgents.azurecr.io/travel-agents-ui:latest \
  --target-port 4200 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.25 \
  --memory 0.5Gi
```

### Container App Configuration

#### UI Container App
```yaml
# Bicep template excerpt
resource uiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-travel-ui'
  location: location
  properties: {
    environmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 4200
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: []
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: managedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'travel-ui'
          image: '${containerRegistry.properties.loginServer}/travel-agents-ui:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'NG_API_URL'
              value: 'https://${apiApp.properties.configuration.ingress.fqdn}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}
```

#### API Container App
```yaml
resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-travel-api'
  location: location
  properties: {
    environmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 4000
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      secrets: [
        {
          name: 'azure-openai-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/azure-openai-key'
          identity: managedIdentity.id
        }
        {
          name: 'bing-search-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/bing-search-key'
          identity: managedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'travel-api'
          image: '${containerRegistry.properties.loginServer}/travel-agents-api:latest'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'AZURE_OPENAI_ENDPOINT'
              value: openAIService.properties.endpoint
            }
            {
              name: 'AZURE_OPENAI_API_KEY'
              secretRef: 'azure-openai-key'
            }
            {
              name: 'BING_SEARCH_API_KEY'
              secretRef: 'bing-search-key'
            }
            // MCP server URLs
            {
              name: 'MCP_ECHO_PING_URL'
              value: 'https://${echoMcpApp.properties.configuration.ingress.fqdn}'
            }
            // Additional environment variables...
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
          {
            name: 'cpu-scaling'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
        ]
      }
    }
  }
}
```

### Deployment Monitoring

#### Deployment Status
```bash
# Check deployment status
azd show

# Monitor container app status
az containerapp show \
  --name ca-travel-api \
  --resource-group rg-travel-agents-prod \
  --query "properties.provisioningState"

# View recent revisions
az containerapp revision list \
  --name ca-travel-api \
  --resource-group rg-travel-agents-prod \
  --query "[].{Name:name,Active:properties.active,CreatedTime:properties.createdTime}"
```

#### Application Logs
```bash
# Stream API logs
az containerapp logs show \
  --name ca-travel-api \
  --resource-group rg-travel-agents-prod \
  --follow

# View specific revision logs
az containerapp logs show \
  --name ca-travel-api \
  --resource-group rg-travel-agents-prod \
  --revision-name "ca-travel-api--xyz123"
```

## Infrastructure as Code

### Bicep Templates Structure

```
infra/
├── main.bicep                 # Main template
├── modules/
│   ├── container-apps.bicep   # Container Apps configuration
│   ├── monitoring.bicep       # Azure Monitor setup
│   ├── security.bicep         # Key Vault, Managed Identity
│   └── ai-services.bicep      # OpenAI, Cognitive Services
├── parameters/
│   ├── dev.bicepparam         # Development parameters
│   ├── staging.bicepparam     # Staging parameters
│   └── prod.bicepparam        # Production parameters
└── scripts/
    ├── deploy.sh              # Deployment scripts
    └── cleanup.sh             # Cleanup scripts
```

### Main Bicep Template

```bicep
// infra/main.bicep
@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Primary location for resources')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'travel-agents'

// Variables
var containerAppName = '${appName}-${environment}'
var resourcePrefix = 'rg-${appName}-${environment}'

// Modules
module containerApps 'modules/container-apps.bicep' = {
  name: 'containerApps'
  params: {
    location: location
    environment: environment
    appName: appName
    containerRegistryName: containerRegistry.outputs.name
    keyVaultName: security.outputs.keyVaultName
    managedIdentityId: security.outputs.managedIdentityId
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    environment: environment
    appName: appName
  }
}

module security 'modules/security.bicep' = {
  name: 'security'
  params: {
    location: location
    environment: environment
    appName: appName
  }
}

module aiServices 'modules/ai-services.bicep' = {
  name: 'aiServices'
  params: {
    location: location
    environment: environment
    appName: appName
    keyVaultName: security.outputs.keyVaultName
  }
}

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'acr${appName}${environment}${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: environment == 'prod' ? 'Premium' : 'Standard'
  }
  properties: {
    adminUserEnabled: false
    policies: {
      trustPolicy: {
        type: 'Notary'
        status: 'enabled'
      }
      retentionPolicy: {
        status: 'enabled'
        days: environment == 'prod' ? 30 : 7
      }
    }
  }
}

// Outputs
output containerAppsEnvironmentFqdn string = containerApps.outputs.environmentFqdn
output uiAppUrl string = containerApps.outputs.uiAppUrl
output apiAppUrl string = containerApps.outputs.apiAppUrl
```

### Container Apps Module

```bicep
// infra/modules/container-apps.bicep
@description('Location for resources')
param location string

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Container registry name')
param containerRegistryName string

@description('Key Vault name')
param keyVaultName string

@description('Managed identity resource ID')
param managedIdentityId string

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${appName}-${environment}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    zoneRedundant: environment == 'prod'
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
      {
        name: 'Dedicated-D4'
        workloadProfileType: 'D4'
        minimumCount: environment == 'prod' ? 1 : 0
        maximumCount: 3
      }
    ]
  }
}

// UI Container App
resource uiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-${appName}-ui-${environment}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    environmentId: containerAppsEnvironment.id
    workloadProfileName: 'Consumption'
    configuration: {
      ingress: {
        external: true
        targetPort: 4200
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: managedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'ui'
          image: '${containerRegistryName}.azurecr.io/${appName}-ui:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'NG_API_URL'
              value: 'https://${apiApp.properties.configuration.ingress.fqdn}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: environment == 'prod' ? 2 : 1
        maxReplicas: environment == 'prod' ? 10 : 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
        ]
      }
    }
  }
}

// API Container App (similar structure)
resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  // ... detailed configuration
}

// MCP Server Container Apps
resource mcpServers 'Microsoft.App/containerApps@2023-05-01' = [for server in mcpServerConfigs: {
  name: 'ca-${appName}-${server.name}-${environment}'
  location: location
  // ... configuration for each MCP server
}]

// Outputs
output environmentFqdn string = containerAppsEnvironment.properties.defaultDomain
output uiAppUrl string = 'https://${uiApp.properties.configuration.ingress.fqdn}'
output apiAppUrl string = 'https://${apiApp.properties.configuration.ingress.fqdn}'
```

### Deployment Scripts

```bash
#!/bin/bash
# infra/scripts/deploy.sh

set -e

# Configuration
ENVIRONMENT=${1:-dev}
LOCATION=${2:-swedencentral}
RESOURCE_GROUP="rg-travel-agents-${ENVIRONMENT}"

echo "Deploying Azure AI Travel Agents to ${ENVIRONMENT} environment..."

# Create resource group if it doesn't exist
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Deploy infrastructure
echo "Deploying infrastructure..."
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file infra/main.bicep \
  --parameters infra/parameters/${ENVIRONMENT}.bicepparam \
  --verbose

# Get Container Registry name
ACR_NAME=$(az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name main \
  --query "properties.outputs.containerRegistryName.value" \
  --output tsv)

# Build and push container images
echo "Building and pushing container images..."

# UI Image
az acr build \
  --registry $ACR_NAME \
  --image travel-agents-ui:latest \
  --file src/ui/Dockerfile \
  src/ui

# API Image
az acr build \
  --registry $ACR_NAME \
  --image travel-agents-api:latest \
  --file src/api/Dockerfile \
  src/api

# MCP Server Images
for server in echo-ping customer-query destination-recommendation itinerary-planning code-evaluation model-inference web-search; do
  echo "Building MCP server: $server"
  az acr build \
    --registry $ACR_NAME \
    --image travel-agents-mcp-${server}:latest \
    --file src/tools/${server}/Dockerfile \
    src/tools/${server}
done

# Update container app revisions
echo "Updating container app revisions..."
az containerapp update \
  --name ca-travel-agents-ui-${ENVIRONMENT} \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_NAME}.azurecr.io/travel-agents-ui:latest

az containerapp update \
  --name ca-travel-agents-api-${ENVIRONMENT} \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_NAME}.azurecr.io/travel-agents-api:latest

echo "Deployment completed successfully!"

# Display application URLs
UI_URL=$(az containerapp show \
  --name ca-travel-agents-ui-${ENVIRONMENT} \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)

API_URL=$(az containerapp show \
  --name ca-travel-agents-api-${ENVIRONMENT} \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)

echo ""
echo "Application URLs:"
echo "UI: https://${UI_URL}"
echo "API: https://${API_URL}"
echo ""
```

## Monitoring and Observability

### Azure Monitor Integration

```bicep
// infra/modules/monitoring.bicep
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-${appName}-${environment}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: environment == 'prod' ? 90 : 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${appName}-${environment}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
  }
}

// Alerts
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'High Response Time Alert'
  location: 'global'
  properties: {
    description: 'Alert when average response time exceeds 5 seconds'
    severity: 2
    enabled: true
    scopes: [
      apiContainerApp.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighResponseTime'
          metricName: 'RequestDuration'
          operator: 'GreaterThan'
          threshold: 5000
          timeAggregation: 'Average'
        }
      ]
    }
  }
}
```

### Custom Dashboards

```json
{
  "dashboard": {
    "title": "Azure AI Travel Agents - Production",
    "tiles": [
      {
        "position": { "x": 0, "y": 0, "colSpan": 6, "rowSpan": 4 },
        "metadata": {
          "type": "Blade",
          "inputs": [
            {
              "name": "query",
              "value": "ContainerAppConsoleLogs_CL | where ContainerAppName_s contains 'travel-agents-api' | where TimeGenerated > ago(1h) | summarize count() by bin(TimeGenerated, 5m)"
            }
          ]
        }
      },
      {
        "position": { "x": 6, "y": 0, "colSpan": 6, "rowSpan": 4 },
        "metadata": {
          "type": "Blade",
          "inputs": [
            {
              "name": "query", 
              "value": "requests | where name contains 'chat' | summarize avg(duration) by bin(timestamp, 5m)"
            }
          ]
        }
      }
    ]
  }
}
```

## Security Configuration

### Managed Identity Setup

```bicep
// Managed identity for container apps
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'mi-${appName}-${environment}'
  location: location
}

// Key Vault access policy
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  name: 'add'
  parent: keyVault
  properties: {
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: managedIdentity.properties.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// Container Registry access
resource containerRegistryAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, managedIdentity.id, 'AcrPull')
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}
```

### Network Security

```bicep
// Virtual network for secure communication
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-05-01' = if (environment == 'prod') {
  name: 'vnet-${appName}-${environment}'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
    subnets: [
      {
        name: 'container-apps-subnet'
        properties: {
          addressPrefix: '10.0.1.0/24'
          delegations: [
            {
              name: 'Microsoft.App.environments'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
    ]
  }
}

// Container Apps Environment with VNet integration
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${appName}-${environment}'
  location: location
  properties: {
    vnetConfiguration: environment == 'prod' ? {
      infrastructureSubnetId: virtualNetwork.properties.subnets[0].id
      internal: false
    } : null
    // ... other properties
  }
}
```

## Scaling and Performance

### Horizontal Pod Autoscaling

```bicep
// API scaling configuration
template: {
  scale: {
    minReplicas: environment == 'prod' ? 2 : 1
    maxReplicas: environment == 'prod' ? 20 : 5
    rules: [
      {
        name: 'http-scaling-rule'
        http: {
          metadata: {
            concurrentRequests: '50'
          }
        }
      }
      {
        name: 'cpu-scaling-rule'
        custom: {
          type: 'cpu'
          metadata: {
            type: 'Utilization'
            value: '70'
          }
        }
      }
      {
        name: 'memory-scaling-rule'
        custom: {
          type: 'memory'
          metadata: {
            type: 'Utilization'
            value: '80'
          }
        }
      }
    ]
  }
}
```

### Performance Optimization

```bash
# Resource allocation per environment
ENVIRONMENT_CONFIGS = {
  "dev": {
    "ui": {"cpu": "0.25", "memory": "0.5Gi", "replicas": {"min": 1, "max": 2}},
    "api": {"cpu": "0.5", "memory": "1Gi", "replicas": {"min": 1, "max": 3}},
    "mcp": {"cpu": "0.25", "memory": "0.5Gi", "replicas": {"min": 1, "max": 2}}
  },
  "staging": {
    "ui": {"cpu": "0.5", "memory": "1Gi", "replicas": {"min": 1, "max": 5}},
    "api": {"cpu": "1.0", "memory": "2Gi", "replicas": {"min": 2, "max": 8}},
    "mcp": {"cpu": "0.5", "memory": "1Gi", "replicas": {"min": 1, "max": 3}}
  },
  "prod": {
    "ui": {"cpu": "0.5", "memory": "1Gi", "replicas": {"min": 2, "max": 10}},
    "api": {"cpu": "2.0", "memory": "4Gi", "replicas": {"min": 3, "max": 20}},
    "mcp": {"cpu": "1.0", "memory": "2Gi", "replicas": {"min": 2, "max": 5}}
  }
}
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# Backup script for critical configurations

# Backup Container Registry images
az acr import \
  --name $BACKUP_ACR \
  --source $PRIMARY_ACR.azurecr.io/travel-agents-api:latest \
  --image travel-agents-api:backup-$(date +%Y%m%d)

# Backup Key Vault secrets
az keyvault secret backup \
  --vault-name $KEY_VAULT_NAME \
  --name azure-openai-key \
  --file backup-secrets-$(date +%Y%m%d).blob

# Backup Application Insights data (export)
az monitor app-insights component export create \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --destination-type Blob \
  --destination-address $BACKUP_STORAGE_URL
```

### Multi-Region Deployment

```bicep
// Primary region deployment
module primaryRegion 'main.bicep' = {
  name: 'primaryRegion'
  params: {
    location: 'swedencentral'
    environment: environment
    isPrimary: true
  }
}

// Secondary region deployment (disaster recovery)
module secondaryRegion 'main.bicep' = if (environment == 'prod') {
  name: 'secondaryRegion'
  params: {
    location: 'northeurope'
    environment: environment
    isPrimary: false
    primaryResourceGroup: primaryRegion.outputs.resourceGroupName
  }
}

// Traffic Manager for failover
resource trafficManager 'Microsoft.Network/trafficManagerProfiles@2022-04-01' = if (environment == 'prod') {
  name: 'tm-${appName}-${environment}'
  location: 'global'
  properties: {
    profileStatus: 'Enabled'
    trafficRoutingMethod: 'Priority'
    endpoints: [
      {
        name: 'primary'
        type: 'externalEndpoints'
        properties: {
          target: primaryRegion.outputs.uiAppFqdn
          priority: 1
          endpointStatus: 'Enabled'
        }
      }
      {
        name: 'secondary'
        type: 'externalEndpoints'
        properties: {
          target: secondaryRegion.outputs.uiAppFqdn
          priority: 2
          endpointStatus: 'Enabled'
        }
      }
    ]
  }
}
```

## Cost Optimization

### Cost Analysis

```bash
# Get current month costs
az consumption usage list \
  --start-date $(date -d "$(date +%Y-%m-01)" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?contains(instanceName, 'travel-agents')].{Service:meterName,Cost:pretaxCost,Usage:quantity}" \
  --output table

# Set up budget alerts
az consumption budget create \
  --budget-name "travel-agents-monthly-budget" \
  --amount 500 \
  --time-grain Monthly \
  --time-period start-date=$(date +%Y-%m-01) \
  --notifications \
    '[{
      "enabled": true,
      "operator": "GreaterThan",
      "threshold": 80,
      "contactEmails": ["admin@example.com"],
      "contactRoles": ["Owner"]
    }]'
```

### Cost-Saving Configurations

```bicep
// Environment-specific cost optimizations
var costOptimizations = {
  dev: {
    // Use consumption pricing for all services
    containerAppsWorkloadProfile: 'Consumption'
    logRetentionDays: 7
    autoShutdown: true
  }
  staging: {
    containerAppsWorkloadProfile: 'Consumption'
    logRetentionDays: 30
    autoShutdown: false
  }
  prod: {
    containerAppsWorkloadProfile: 'Dedicated-D4'
    logRetentionDays: 90
    autoShutdown: false
  }
}

// Auto-shutdown for dev environment
resource autoShutdownScript 'Microsoft.Resources/deploymentScripts@2023-08-01' = if (environment == 'dev') {
  name: 'auto-shutdown-${environment}'
  location: location
  kind: 'AzurePowerShell'
  properties: {
    azPowerShellVersion: '9.0'
    scriptContent: '''
      # Scale down to 0 replicas during off-hours (evenings and weekends)
      $resourceGroup = $env:AZURE_RESOURCE_GROUP
      $containerApps = az containerapp list --resource-group $resourceGroup --query "[].name" -o tsv
      
      foreach ($app in $containerApps) {
        az containerapp update --name $app --resource-group $resourceGroup --min-replicas 0
      }
    '''
    retentionInterval: 'P1D'
  }
}
```

This comprehensive deployment architecture guide provides the complete framework for deploying the Azure AI Travel Agents system across different environments, from local development to production-ready Azure Container Apps deployments.