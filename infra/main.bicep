targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

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

param isContinuousIntegration bool // Set in main.parameters.json

// Tags that should be applied to all resources.
// 
// Note that 'azd-service-name' tags should be applied separately to service host resources.
// Example usage:
//   tags: union(tags, { 'azd-service-name': <service name in azure.yaml> })
var tags = {
  'azd-env-name': environmentName
}

// Organize resources in a resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

var llamaIndexConfig = {
  chat: {
    model: 'gpt-4o-mini'
    version: '2024-07-18'
    capacity: 50
  }
  embedding: {
    model: 'text-embedding-3-large'
    version: '1'
    dim: '1024'
    capacity: 10
  }
  sampleAccessTokens: {
    echo: '123-this-is-a-fake-token-please-use-a-token-provider'
  }
  model_provider: 'openai'
  llm_temperature: '0.7'
  llm_max_tokens: '100'
  top_k: '3'
  // A2A Protocol Configuration
  a2a: {
    server: {
      enabled: true
      port: 3001
      host: 'localhost'
    }
    client: {
      enabled: false
      registries: []
    }
    agentToAgent: false
  }
}


module resources 'resources.bicep' = {
  scope: rg
  name: 'resources'
  params: {
    location: location
    tags: tags
    principalId: principalId
    apiExists: apiExists
    apiDefinition: apiDefinition
    uiExists: uiExists
    uiDefinition: uiDefinition
    llamaIndexConfig: llamaIndexConfig
    isContinuousIntegration: isContinuousIntegration
    itineraryPlanningExists: itineraryPlanningExists
    itineraryPlanningDefinition: itineraryPlanningDefinition
    customerQueryExists: customerQueryExists
    customerQueryDefinition: customerQueryDefinition
    destinationRecommendationExists: destinationRecommendationExists
    destinationRecommendationDefinition: destinationRecommendationDefinition
    echoPingExists: echoPingExists
    echoPingDefinition: echoPingDefinition
  }
}

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
output AZURE_RESOURCE_API_ID string = resources.outputs.AZURE_RESOURCE_API_ID
output AZURE_RESOURCE_UI_ID string = resources.outputs.AZURE_RESOURCE_UI_ID
output AZURE_RESOURCE_ITINERARY_PLANNING_ID string = resources.outputs.AZURE_RESOURCE_ITINERARY_PLANNING_ID
output AZURE_RESOURCE_CUSTOMER_QUERY_ID string = resources.outputs.AZURE_RESOURCE_CUSTOMER_QUERY_ID
output AZURE_RESOURCE_DESTINATION_RECOMMENDATION_ID string = resources.outputs.AZURE_RESOURCE_DESTINATION_RECOMMENDATION_ID
output AZURE_RESOURCE_ECHO_PING_ID string = resources.outputs.AZURE_RESOURCE_ECHO_PING_ID
output NG_API_URL string = resources.outputs.NG_API_URL
output AZURE_OPENAI_ENDPOINT string = resources.outputs.AZURE_OPENAI_ENDPOINT
output AZURE_OPENAI_DEPLOYMENT string = llamaIndexConfig.chat.model
output AZURE_OPENAI_API_VERSION string = llamaIndexConfig.chat.version

//  LlamaIndex configuration
output EMBEDDING_MODEL string = llamaIndexConfig.embedding.model
output EMBEDDING_DIM string = llamaIndexConfig.embedding.dim
output AZURE_CLIENT_ID string = resources.outputs.AZURE_CLIENT_ID
output AZURE_TENANT_ID string = tenant().tenantId
output MCP_ECHO_PING_ACCESS_TOKEN string = llamaIndexConfig.sampleAccessTokens.echo

// A2A Protocol configuration
output A2A_SERVER_ENABLED string = string(llamaIndexConfig.a2a.server.enabled)
output A2A_SERVER_PORT string = string(llamaIndexConfig.a2a.server.port)
output A2A_SERVER_HOST string = llamaIndexConfig.a2a.server.host
output A2A_CLIENT_ENABLED string = string(llamaIndexConfig.a2a.client.enabled)
output A2A_AGENT_TO_AGENT string = string(llamaIndexConfig.a2a.agentToAgent)
