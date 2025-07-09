@description('The location used for all deployed resources')
param location string = resourceGroup().location

@description('Tags that will be applied to all resources')
param tags object = {}


param apiExists bool
@secure()
param apiDefinition object
param uiExists bool
@secure()
param uiDefinition object
param itineraryPlanningExists bool
@secure()
param itineraryPlanningDefinition object
param customerQueryExists bool
@secure()
param customerQueryDefinition object
param destinationRecommendationExists bool
@secure()
param destinationRecommendationDefinition object
param echoPingExists bool
@secure()
param echoPingDefinition object

@description('Id of the user or app to assign application roles')
param principalId string

@description('The configuration for the LlamaIndex application')
param llamaIndexConfig object = {}

param isContinuousIntegration bool
var principalType = isContinuousIntegration ? 'ServicePrincipal' : 'User'

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location)

// Monitor application with Azure Monitor
module monitoring 'br/public:avm/ptn/azd/monitoring:0.1.0' = {
  name: 'monitoring'
  params: {
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
    applicationInsightsDashboardName: '${abbrs.portalDashboards}${resourceToken}'
    location: location
    tags: tags
  }
}

// Container registry
module containerRegistry 'br/public:avm/res/container-registry/registry:0.1.1' = {
  name: 'registry'
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
    publicNetworkAccess: 'Enabled'
    roleAssignments:[
      {
        principalId: apiIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: uiIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: itineraryPlanningIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: customerQueryIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: destinationRecommendationIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: echoPingIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
    ]
  }
}

// Container apps environment
module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.4.5' = {
  name: 'container-apps-environment'
  params: {
    logAnalyticsWorkspaceResourceId: monitoring.outputs.logAnalyticsWorkspaceResourceId
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    zoneRedundant: false
  }
}

module apiIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'apiidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}api-${resourceToken}'
    location: location
  }
}

module apiFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'api-fetch-image'
  params: {
    exists: apiExists
    name: 'api'
  }
}

var apiAppSettingsArray = filter(array(apiDefinition.settings), i => i.name != '')
var apiSecrets = map(filter(apiAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var apiEnv = map(filter(apiAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module api 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'api'
  params: {
    name: 'api'
    ingressTargetPort: 4000
    corsPolicy: {
      allowedOrigins: [
        'https://ui.${containerAppsEnvironment.outputs.defaultDomain}'
      ]
      allowedMethods: [
        'GET', 'POST'
      ]
    }
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(apiSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: apiFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'DEBUG'
            value: 'true'
          }
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: apiIdentity.outputs.clientId
          }
          {
            name: 'LLM_PROVIDER'
            value: 'azure-openai'
          }
          {
            name: 'AZURE_OPENAI_ENDPOINT' 
            value: openAi.outputs.endpoint
          }
          {
            name: 'AZURE_OPENAI_DEPLOYMENT' 
            value: llamaIndexConfig.chat.model
          }
          {
            name: 'MCP_ITINERARY_PLANNING_URL'
            value: 'https://itinerary-planning.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_CUSTOMER_QUERY_URL'
            value: 'https://customer-query.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_DESTINATION_RECOMMENDATION_URL'
            value: 'https://destination-recommendation.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_ECHO_PING_URL'
            value: 'https://echo-ping.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_WEB_SEARCH_URL'
            value: 'https://web-search.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_MODEL_INFERENCE_URL'
            value: 'https://model-inference.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_CODE_EVALUATION_URL'
            value: 'https://code-evaluation.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_ECHO_PING_ACCESS_TOKEN'
            value: llamaIndexConfig.sampleAccessTokens.echo
          }
          {
            name: 'PORT'
            value: '4000'
          }
        ],
        apiEnv,
        map(apiSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [apiIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: apiIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'api' })
  }
}

module uiIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'uiidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}ui-${resourceToken}'
    location: location
  }
}

module uiFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'ui-fetch-image'
  params: {
    exists: uiExists
    name: 'ui'
  }
}

var uiAppSettingsArray = filter(array(uiDefinition.settings), i => i.name != '')
var uiSecrets = map(filter(uiAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var uiEnv = map(filter(uiAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module ui 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'ui'
  params: {
    name: 'ui'
    ingressTargetPort: 80
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(uiSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: uiFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: uiIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '80'
          }
        ],
        uiEnv,
        map(uiSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [uiIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: uiIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'ui' })
  }
}

module itineraryPlanningIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'itineraryPlanningidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}itineraryPlanning-${resourceToken}'
    location: location
  }
}

module itineraryPlanningFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'itineraryPlanning-fetch-image'
  params: {
    exists: itineraryPlanningExists
    name: 'itinerary-planning'
  }
}

var itineraryPlanningAppSettingsArray = filter(array(itineraryPlanningDefinition.settings), i => i.name != '')
var itineraryPlanningSecrets = map(filter(itineraryPlanningAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var itineraryPlanningEnv = map(filter(itineraryPlanningAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module itineraryPlanning 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'itineraryPlanning'
  params: {
    name: 'itinerary-planning'
    ingressTargetPort: 8000
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(itineraryPlanningSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: itineraryPlanningFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: itineraryPlanningIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '8000'
          }
        ],
        itineraryPlanningEnv,
        map(itineraryPlanningSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [itineraryPlanningIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: itineraryPlanningIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'itinerary-planning' })
  }
}

module customerQueryIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'customerQueryidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}customerQuery-${resourceToken}'
    location: location
  }
}

module customerQueryFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'customerQuery-fetch-image'
  params: {
    exists: customerQueryExists
    name: 'customer-query'
  }
}

var customerQueryAppSettingsArray = filter(array(customerQueryDefinition.settings), i => i.name != '')
var customerQuerySecrets = map(filter(customerQueryAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var customerQueryEnv = map(filter(customerQueryAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module customerQuery 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'customerQuery'
  params: {
    name: 'customer-query'
    ingressTargetPort: 8080
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(customerQuerySecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: customerQueryFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: customerQueryIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '8080'
          }
        ],
        customerQueryEnv,
        map(customerQuerySecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [customerQueryIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: customerQueryIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'customer-query' })
  }
}

module destinationRecommendationIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'destinationRecommendationidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}destinationRecommendation-${resourceToken}'
    location: location
  }
}

module destinationRecommendationFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'destinationRecommendation-fetch-image'
  params: {
    exists: destinationRecommendationExists
    name: 'destination-recommendation'
  }
}

var destinationRecommendationAppSettingsArray = filter(array(destinationRecommendationDefinition.settings), i => i.name != '')
var destinationRecommendationSecrets = map(filter(destinationRecommendationAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var destinationRecommendationEnv = map(filter(destinationRecommendationAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module destinationRecommendation 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'destinationRecommendation'
  params: {
    name: 'destination-recommendation'
    ingressTargetPort: 8080
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(destinationRecommendationSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: destinationRecommendationFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: destinationRecommendationIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '8080'
          }
        ],
        destinationRecommendationEnv,
        map(destinationRecommendationSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [destinationRecommendationIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: destinationRecommendationIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'destination-recommendation' })
  }
}

module echoPingIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'echoPingidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}echoPing-${resourceToken}'
    location: location
  }
}

module echoPingFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'echoPing-fetch-image'
  params: {
    exists: echoPingExists
    name: 'echo-ping'
  }
}

var echoPingAppSettingsArray = filter(array(echoPingDefinition.settings), i => i.name != '')
var echoPingSecrets = map(filter(echoPingAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var echoPingEnv = map(filter(echoPingAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module echoPing 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'echoPing'
  params: {
    name: 'echo-ping'
    ingressTargetPort: 5000
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(echoPingSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: echoPingFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: union([
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: echoPingIdentity.outputs.clientId
          }
          {
            name: 'MCP_ECHO_PING_ACCESS_TOKEN'
            value: llamaIndexConfig.sampleAccessTokens.echo
          }
          {
            name: 'PORT'
            value: '5000'
          }
        ],
        echoPingEnv,
        map(echoPingSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [echoPingIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: echoPingIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'echo-ping' })
  }
}

module openAi 'br/public:avm/res/cognitive-services/account:0.10.2' =  {
  name: 'openai'
  params: {
    name: '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    tags: tags
    location: location
    kind: 'AIServices'
    // kind: 'OpenAI'
    disableLocalAuth: false
    customSubDomainName: '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    publicNetworkAccess: 'Enabled'
    deployments: [
      {
        name: llamaIndexConfig.chat.model
        model: {
          format: 'OpenAI'
          name: llamaIndexConfig.chat.model
          version: llamaIndexConfig.chat.version
        }
        sku: {
          capacity: llamaIndexConfig.chat.capacity
          name: 'GlobalStandard'
        }
        versionUpgradeOption: 'OnceCurrentVersionExpired'
      }
    ]
    roleAssignments: [
      {
        principalId: principalId
        principalType: principalType
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
      }
      {
        principalId: apiIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
      }
    ]
  }
}

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_RESOURCE_API_ID string = api.outputs.resourceId
output AZURE_RESOURCE_UI_ID string = ui.outputs.resourceId
output AZURE_RESOURCE_ITINERARY_PLANNING_ID string = itineraryPlanning.outputs.resourceId
output AZURE_RESOURCE_CUSTOMER_QUERY_ID string = customerQuery.outputs.resourceId
output AZURE_RESOURCE_DESTINATION_RECOMMENDATION_ID string = destinationRecommendation.outputs.resourceId
output AZURE_RESOURCE_ECHO_PING_ID string = echoPing.outputs.resourceId
output AZURE_OPENAI_ENDPOINT string = openAi.outputs.endpoint
output NG_API_URL string = 'https://api.${containerAppsEnvironment.outputs.defaultDomain}'
output AZURE_CLIENT_ID string = apiIdentity.outputs.clientId
