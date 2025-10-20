@description('The location used for all deployed resources')
param location string = resourceGroup().location

@description('Tags that will be applied to all resources')
param tags object = {}

param apiLangchainJsExists bool
@secure()
param apiLangchainJsDefinition object
param apiLlamaindexTsExists bool
@secure()
param apiLlamaindexTsDefinition object
param apiMafPythonExists bool
@secure()
param apiMafPythonDefinition object
param uiAngularExists bool
@secure()
param uiAngularDefinition object
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

@description('The configuration for the orchestrator applications')
param orchestratorConfig object = {}

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
        principalId: apiLangchainJsIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: apiLlamaindexTsIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: apiMafPythonIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: uiAngularIdentity.outputs.principalId
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

module apiLangchainJsIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'apiLangchainJsidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}api-langchain-js-${resourceToken}'
    location: location
  }
}

module apiLangchainJsFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'api-langchain-js-fetch-image'
  params: {
    exists: apiLangchainJsExists
    name: 'api-langchain-js'
  }
}

var apiLangchainJsAppSettingsArray = filter(array(apiLangchainJsDefinition.settings), i => i.name != '')
var apiLangchainJsSecrets = map(filter(apiLangchainJsAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var apiLangchainJsEnv = map(filter(apiLangchainJsAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module apiLangchainJs 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'apiLangchainJs'
  params: {
    name: 'api-langchain-js'
    ingressTargetPort: 4000
    corsPolicy: {
      allowedOrigins: [
        'https://ui-angular.${containerAppsEnvironment.outputs.defaultDomain}'
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
      map(apiLangchainJsSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: apiLangchainJsFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: apiLangchainJsIdentity.outputs.clientId
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
            value: orchestratorConfig.chat.model
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
            name: 'MCP_ECHO_PING_ACCESS_TOKEN'
            value: orchestratorConfig.sampleAccessTokens.echo
          }
          {
            name: 'PORT'
            value: '4000'
          }
        ],
        apiLangchainJsEnv,
        map(apiLangchainJsSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [apiLangchainJsIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: apiLangchainJsIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'api-langchain-js' })
  }
}

module apiLlamaindexTsIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'apiLlamaindexTsidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}api-llamaindex-ts-${resourceToken}'
    location: location
  }
}

module apiLlamaindexTsFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'api-llamaindex-ts-fetch-image'
  params: {
    exists: apiLlamaindexTsExists
    name: 'api-llamaindex-ts'
  }
}

var apiLlamaindexTsAppSettingsArray = filter(array(apiLlamaindexTsDefinition.settings), i => i.name != '')
var apiLlamaindexTsSecrets = map(filter(apiLlamaindexTsAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var apiLlamaindexTsEnv = map(filter(apiLlamaindexTsAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module apiLlamaindexTs 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'apiLlamaindexTs'
  params: {
    name: 'api-llamaindex-ts'
    ingressTargetPort: 4000
    corsPolicy: {
      allowedOrigins: [
        'https://ui-angular.${containerAppsEnvironment.outputs.defaultDomain}'
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
      map(apiLlamaindexTsSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: apiLlamaindexTsFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: apiLlamaindexTsIdentity.outputs.clientId
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
            value: orchestratorConfig.chat.model
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
            name: 'MCP_ECHO_PING_ACCESS_TOKEN'
            value: orchestratorConfig.sampleAccessTokens.echo
          }
          {
            name: 'PORT'
            value: '4000'
          }
        ],
        apiLlamaindexTsEnv,
        map(apiLlamaindexTsSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [apiLlamaindexTsIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: apiLlamaindexTsIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'api-llamaindex-ts' })
  }
}

module apiMafPythonIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'apiMafPythonidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}api-maf-python-${resourceToken}'
    location: location
  }
}

module apiMafPythonFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'api-maf-python-fetch-image'
  params: {
    exists: apiMafPythonExists
    name: 'api-maf-python'
  }
}

var apiMafPythonAppSettingsArray = filter(array(apiMafPythonDefinition.settings), i => i.name != '')
var apiMafPythonSecrets = map(filter(apiMafPythonAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var apiMafPythonEnv = map(filter(apiMafPythonAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module apiMafPython 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'apiMafPython'
  params: {
    name: 'api-maf-python'
    ingressTargetPort: 4000
    corsPolicy: {
      allowedOrigins: [
        'https://ui-angular.${containerAppsEnvironment.outputs.defaultDomain}'
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
      map(apiMafPythonSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: apiMafPythonFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: apiMafPythonIdentity.outputs.clientId
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
            value: orchestratorConfig.chat.model
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
            name: 'MCP_ECHO_PING_ACCESS_TOKEN'
            value: orchestratorConfig.sampleAccessTokens.echo
          }
          {
            name: 'PORT'
            value: '4000'
          }
        ],
        apiMafPythonEnv,
        map(apiMafPythonSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [apiMafPythonIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: apiMafPythonIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'api-maf-python' })
  }
}

module uiAngularIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'uiAngularidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}ui-angular-${resourceToken}'
    location: location
  }
}

module uiAngularFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'ui-angular-fetch-image'
  params: {
    exists: uiAngularExists
    name: 'ui-angular'
  }
}

var uiAngularAppSettingsArray = filter(array(uiAngularDefinition.settings), i => i.name != '')
var uiAngularSecrets = map(filter(uiAngularAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var uiAngularEnv = map(filter(uiAngularAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module uiAngular 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'uiAngular'
  params: {
    name: 'ui-angular'
    ingressTargetPort: 80
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(uiAngularSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: uiAngularFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: uiAngularIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '80'
          }
        ],
        uiAngularEnv,
        map(uiAngularSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [uiAngularIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: uiAngularIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'ui-angular' })
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
            value: orchestratorConfig.sampleAccessTokens.echo
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
        name: orchestratorConfig.chat.model
        model: {
          format: 'OpenAI'
          name: orchestratorConfig.chat.model
          version: orchestratorConfig.chat.version
        }
        sku: {
          capacity: orchestratorConfig.chat.capacity
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
        principalId: apiLangchainJsIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
      }
      {
        principalId: apiLlamaindexTsIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
      }
      {
        principalId: apiMafPythonIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: 'Cognitive Services OpenAI User'
      }
    ]
  }
}

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_RESOURCE_API_LANGCHAIN_JS_ID string = apiLangchainJs.outputs.resourceId
output AZURE_RESOURCE_API_LLAMAINDEX_TS_ID string = apiLlamaindexTs.outputs.resourceId
output AZURE_RESOURCE_API_MAF_PYTHON_ID string = apiMafPython.outputs.resourceId
output AZURE_RESOURCE_UI_ANGULAR_ID string = uiAngular.outputs.resourceId
output AZURE_RESOURCE_ITINERARY_PLANNING_ID string = itineraryPlanning.outputs.resourceId
output AZURE_RESOURCE_CUSTOMER_QUERY_ID string = customerQuery.outputs.resourceId
output AZURE_RESOURCE_DESTINATION_RECOMMENDATION_ID string = destinationRecommendation.outputs.resourceId
output AZURE_RESOURCE_ECHO_PING_ID string = echoPing.outputs.resourceId
output AZURE_OPENAI_ENDPOINT string = openAi.outputs.endpoint
output NG_API_URL_LANGCHAIN_JS string = 'https://api-langchain-js.${containerAppsEnvironment.outputs.defaultDomain}'
output NG_API_URL_LLAMAINDEX_TS string = 'https://api-llamaindex-ts.${containerAppsEnvironment.outputs.defaultDomain}'
output NG_API_URL_MAF_PYTHON string = 'https://api-maf-python.${containerAppsEnvironment.outputs.defaultDomain}'
output AZURE_CLIENT_ID string = apiLangchainJsIdentity.outputs.clientId
