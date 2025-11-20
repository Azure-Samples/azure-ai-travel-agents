targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

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

var orchestratorConfig = {
  chat: {
    model: 'gpt-5-mini'
    version: '2025-08-07'
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
  llm_temperature: '1'
  llm_max_tokens: '100'
  top_k: '3'
}


module resources 'resources.bicep' = {
  scope: rg
  name: 'resources'
  params: {
    location: location
    tags: tags
    principalId: principalId
    apiLangchainJsExists: apiLangchainJsExists
    apiLangchainJsDefinition: apiLangchainJsDefinition
    apiLlamaindexTsExists: apiLlamaindexTsExists
    apiLlamaindexTsDefinition: apiLlamaindexTsDefinition
    apiMafPythonExists: apiMafPythonExists
    apiMafPythonDefinition: apiMafPythonDefinition
    uiAngularExists: uiAngularExists
    uiAngularDefinition: uiAngularDefinition
    orchestratorConfig: orchestratorConfig
    isContinuousIntegration: isContinuousIntegration
    mcpItineraryPlanningExists: mcpItineraryPlanningExists
    mcpItineraryPlanningDefinition: mcpItineraryPlanningDefinition
    mcpCustomerQueryExists: mcpCustomerQueryExists
    mcpCustomerQueryDefinition: mcpCustomerQueryDefinition
    mcpDestinationRecommendationExists: mcpDestinationRecommendationExists
    mcpDestinationRecommendationDefinition: mcpDestinationRecommendationDefinition
    mcpEchoPingExists: mcpEchoPingExists
    mcpEchoPingDefinition: mcpEchoPingDefinition
  }
}

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
output AZURE_RESOURCE_API_LANGCHAIN_JS_ID string = resources.outputs.AZURE_RESOURCE_API_LANGCHAIN_JS_ID
output AZURE_RESOURCE_API_LLAMAINDEX_TS_ID string = resources.outputs.AZURE_RESOURCE_API_LLAMAINDEX_TS_ID
output AZURE_RESOURCE_API_MAF_PYTHON_ID string = resources.outputs.AZURE_RESOURCE_API_MAF_PYTHON_ID
output AZURE_RESOURCE_UI_ANGULAR_ID string = resources.outputs.AZURE_RESOURCE_UI_ANGULAR_ID
output AZURE_RESOURCE_ITINERARY_PLANNING_ID string = resources.outputs.AZURE_RESOURCE_ITINERARY_PLANNING_ID
output AZURE_RESOURCE_CUSTOMER_QUERY_ID string = resources.outputs.AZURE_RESOURCE_CUSTOMER_QUERY_ID
output AZURE_RESOURCE_DESTINATION_RECOMMENDATION_ID string = resources.outputs.AZURE_RESOURCE_DESTINATION_RECOMMENDATION_ID
output AZURE_RESOURCE_ECHO_PING_ID string = resources.outputs.AZURE_RESOURCE_ECHO_PING_ID
output NG_API_URL_LANGCHAIN_JS string = resources.outputs.NG_API_URL_LANGCHAIN_JS
output NG_API_URL_LLAMAINDEX_TS string = resources.outputs.NG_API_URL_LLAMAINDEX_TS
output NG_API_URL_MAF_PYTHON string = resources.outputs.NG_API_URL_MAF_PYTHON
output AZURE_OPENAI_ENDPOINT string = resources.outputs.AZURE_OPENAI_ENDPOINT
output AZURE_OPENAI_DEPLOYMENT string = orchestratorConfig.chat.model
output AZURE_OPENAI_API_VERSION string = orchestratorConfig.chat.version

//  Orchestrator configuration
output EMBEDDING_MODEL string = orchestratorConfig.embedding.model
output EMBEDDING_DIM string = orchestratorConfig.embedding.dim
output AZURE_CLIENT_ID string = resources.outputs.AZURE_CLIENT_ID
output AZURE_TENANT_ID string = tenant().tenantId
output MCP_ECHO_PING_ACCESS_TOKEN string = orchestratorConfig.sampleAccessTokens.echo
