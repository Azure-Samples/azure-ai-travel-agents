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

param mcpItineraryPlanningExists bool
@secure()
param mcpItineraryPlanningDefinition object

param mcpCustomerQueryExists bool
@secure()
param mcpCustomerQueryDefinition object

param mcpDestinationRecommendationExists bool
@secure()
param mcpDestinationRecommendationDefinition object

param mcpEchoPingExists bool
@secure()
param mcpEchoPingDefinition object

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
        principalId: mcpItineraryPlanningIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: mcpCustomerQueryIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: mcpDestinationRecommendationIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
      {
        principalId: mcpEchoPingIdentity.outputs.principalId
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
    name: '${abbrs.managedIdentityUserAssignedIdentities}-api-langchain-js-${resourceToken}'
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
            value: 'https://mcp-itinerary-planning.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_CUSTOMER_QUERY_URL'
            value: 'https://mcp-customer-query.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_DESTINATION_RECOMMENDATION_URL'
            value: 'https://mcp-destination-recommendation.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_ECHO_PING_URL'
            value: 'https://mcp-echo-ping.internal.${containerAppsEnvironment.outputs.defaultDomain}'
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
    name: '${abbrs.managedIdentityUserAssignedIdentities}-api-llamaindex-ts-${resourceToken}'
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
            value: 'https://mcp-itinerary-planning.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_CUSTOMER_QUERY_URL'
            value: 'https://mcp-customer-query.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_DESTINATION_RECOMMENDATION_URL'
            value: 'https://mcp-destination-recommendation.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_ECHO_PING_URL'
            value: 'https://mcp-echo-ping.internal.${containerAppsEnvironment.outputs.defaultDomain}'
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
    name: '${abbrs.managedIdentityUserAssignedIdentities}-api-maf-python-${resourceToken}'
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
            value: 'https://mcp-itinerary-planning.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_CUSTOMER_QUERY_URL'
            value: 'https://mcp-customer-query.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_DESTINATION_RECOMMENDATION_URL'
            value: 'https://mcp-destination-recommendation.internal.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'MCP_ECHO_PING_URL'
            value: 'https://mcp-echo-ping.internal.${containerAppsEnvironment.outputs.defaultDomain}'
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
    name: '${abbrs.managedIdentityUserAssignedIdentities}-ui-angular-${resourceToken}'
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
            name: 'NG_API_URL_LANGCHAIN_JS'
            value: 'https://api-langchain-js.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'NG_API_URL_LLAMAINDEX_TS'
            value: 'https://api-llamaindex-ts.${containerAppsEnvironment.outputs.defaultDomain}'
          }
          {
            name: 'NG_API_URL_MAF_PYTHON'
            value: 'https://api-maf-python.${containerAppsEnvironment.outputs.defaultDomain}'
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

module mcpItineraryPlanningIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'mcp-itinerary-planning-identity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}-mcp-itinerary-planning-${resourceToken}'
    location: location
  }
}

module mcpItineraryPlanningFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'mcp-itinerary-planning-fetch-image'
  params: {
    exists: mcpItineraryPlanningExists
    name: 'mcp-itinerary-planning'
  }
}

var mcpItineraryPlanningAppSettingsArray = filter(array(mcpItineraryPlanningDefinition.settings), i => i.name != '')
var mcpItineraryPlanningSecrets = map(filter(mcpItineraryPlanningAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var mcpItineraryPlanningEnv = map(filter(mcpItineraryPlanningAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module mcpItineraryPlanning 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'mcp-itinerary-planning'
  params: {
    name: 'mcp-itinerary-planning'
    ingressTargetPort: 8000
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(mcpItineraryPlanningSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: mcpItineraryPlanningFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: mcpItineraryPlanningIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '8000'
          }
        ],
        mcpItineraryPlanningEnv,
        map(mcpItineraryPlanningSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [mcpItineraryPlanningIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: mcpItineraryPlanningIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'mcp-itinerary-planning' })
  }
}

module mcpCustomerQueryIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'mcp-customer-query-identity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}-mcp-customer-query-${resourceToken}'
    location: location
  }
}

module mcpCustomerQueryFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'mcp-customer-query-fetch-image'
  params: {
    exists: mcpCustomerQueryExists
    name: 'mcp-customer-query'
  }
}

var mcpCustomerQueryAppSettingsArray = filter(array(mcpCustomerQueryDefinition.settings), i => i.name != '')
var mcpCustomerQuerySecrets = map(filter(mcpCustomerQueryAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var mcpCustomerQueryEnv = map(filter(mcpCustomerQueryAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module mcpCustomerQuery 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'mcp-customer-query'
  params: {
    name: 'mcp-customer-query'
    ingressTargetPort: 8080
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(mcpCustomerQuerySecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: mcpCustomerQueryFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: mcpCustomerQueryIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '8080'
          }
        ],
        mcpCustomerQueryEnv,
        map(mcpCustomerQuerySecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [mcpCustomerQueryIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: mcpCustomerQueryIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'mcp-customer-query' })
  }
}

module mcpDestinationRecommendationIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'mcp-destination-recommendation-identity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}-mcp-destination-recommendation-${resourceToken}'
    location: location
  }
}

module mcpDestinationRecommendationFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'mcp-destination-recommendation-fetch-image'
  params: {
    exists: mcpDestinationRecommendationExists
    name: 'mcp-destination-recommendation'
  }
}

var mcpDestinationRecommendationAppSettingsArray = filter(array(mcpDestinationRecommendationDefinition.settings), i => i.name != '')
var mcpDestinationRecommendationSecrets = map(filter(mcpDestinationRecommendationAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var mcpDestinationRecommendationEnv = map(filter(mcpDestinationRecommendationAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module mcpDestinationRecommendation 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'mcp-destination-recommendation'
  params: {
    name: 'mcp-destination-recommendation'
    ingressTargetPort: 8080
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(mcpDestinationRecommendationSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: mcpDestinationRecommendationFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: mcpDestinationRecommendationIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '8080'
          }
        ],
        mcpDestinationRecommendationEnv,
        map(mcpDestinationRecommendationSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [mcpDestinationRecommendationIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: mcpDestinationRecommendationIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'mcp-destination-recommendation' })
  }
}

module mcpEchoPingIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'mcp-echoPingidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}-mcp-echo-ping-${resourceToken}'
    location: location
  }
}

module mcpEchoPingFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'mcp-echoPing-fetch-image'
  params: {
    exists: mcpEchoPingExists
    name: 'mcp-echo-ping'
  }
}

var mcpEchoPingAppSettingsArray = filter(array(mcpEchoPingDefinition.settings), i => i.name != '')
var mcpEchoPingSecrets = map(filter(mcpEchoPingAppSettingsArray, i => i.?secret != null), i => {
  name: i.name
  value: i.value
  secretRef: i.?secretRef ?? take(replace(replace(toLower(i.name), '_', '-'), '.', '-'), 32)
})
var mcpEchoPingEnv = map(filter(mcpEchoPingAppSettingsArray, i => i.?secret == null), i => {
  name: i.name
  value: i.value
})

module mcpEchoPing 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'mcp-echo-ping'
  params: {
    name: 'mcp-echo-ping'
    ingressTargetPort: 5000
    ingressExternal: false
    stickySessionsAffinity: 'none'
    ingressTransport: 'http'
    scaleMinReplicas: 1
    scaleMaxReplicas: 1
    secrets: {
      secureList:  union([
      ],
      map(mcpEchoPingSecrets, secret => {
        name: secret.secretRef
        value: secret.value
      }))
    }
    containers: [
      {
        image: mcpEchoPingFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
            value: mcpEchoPingIdentity.outputs.clientId
          }
          {
            name: 'MCP_ECHO_PING_ACCESS_TOKEN'
            value: orchestratorConfig.sampleAccessTokens.echo
          }
          {
            name: 'OTEL_SERVICE_NAME'
            value: 'tool-echo-ping'
          }
          {
            name: 'OTEL_EXPORTER_OTLP_ENDPOINT'
            value: '' // defaults to auto-detected from Application Insights
          }
          {
            name: 'OTEL_EXPORTER_OTLP_HEADERS'
            value: 'x-otlp-header=header-value'
          }
          {
            name: 'PORT'
            value: '5000'
          }
        ],
        mcpEchoPingEnv,
        map(mcpEchoPingSecrets, secret => {
            name: secret.name
            secretRef: secret.secretRef
        }))
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [mcpEchoPingIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.outputs.loginServer
        identity: mcpEchoPingIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'mcp-echo-ping' })
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
output AZURE_RESOURCE_MCP_ITINERARY_PLANNING_ID string = mcpItineraryPlanning.outputs.resourceId
output AZURE_RESOURCE_MCP_CUSTOMER_QUERY_ID string = mcpCustomerQuery.outputs.resourceId
output AZURE_RESOURCE_MCP_DESTINATION_RECOMMENDATION_ID string = mcpDestinationRecommendation.outputs.resourceId
output AZURE_RESOURCE_MCP_ECHO_PING_ID string = mcpEchoPing.outputs.resourceId
output AZURE_OPENAI_ENDPOINT string = openAi.outputs.endpoint
output NG_API_URL_LANGCHAIN_JS string = 'https://api-langchain-js.${containerAppsEnvironment.outputs.defaultDomain}'
output NG_API_URL_LLAMAINDEX_TS string = 'https://api-llamaindex-ts.${containerAppsEnvironment.outputs.defaultDomain}'
output NG_API_URL_MAF_PYTHON string = 'https://api-maf-python.${containerAppsEnvironment.outputs.defaultDomain}'
output AZURE_CLIENT_ID string = apiLangchainJsIdentity.outputs.clientId
