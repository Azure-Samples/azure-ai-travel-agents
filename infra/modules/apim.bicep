@description('The location used for all deployed resources')
param location string = resourceGroup().location

@description('Tags that will be applied to all resources')
param tags object = {}

@description('The name of the APIM instance')
param apimName string

@description('The SKU name of the APIM instance')
param apimSkuName string = 'Developer'

@description('The SKU capacity of the APIM instance')
param apimSkuCapacity int = 1

@description('The publisher name of the APIM instance')
param publisherName string = 'Azure AI Travel Agents'

@description('The publisher email of the APIM instance')
param publisherEmail string

@description('Container Apps Environment default domain')
param containerAppsDefaultDomain string

@description('Enable GenAI capabilities')
param enableGenAI bool = true

// API Management instance using AVM
module apim 'br/public:avm/res/api-management/service:0.2.0' = {
  name: 'apim'
  params: {
    name: apimName
    location: location
    tags: tags
    sku: {
      name: apimSkuName
      capacity: apimSkuCapacity
    }
    publisherName: publisherName
    publisherEmail: publisherEmail
  }
}

output apimName string = apim.outputs.name
output apimGatewayUrl string = apim.outputs.gatewayUrl
output apimResourceId string = apim.outputs.resourceId
output apiUrls object = {
  ui: '${apim.outputs.gatewayUrl}/ui'
  api: '${apim.outputs.gatewayUrl}/api'
  customerQuery: '${apim.outputs.gatewayUrl}/mcp/customer-query'
  destinationRecommendation: '${apim.outputs.gatewayUrl}/mcp/destination-recommendation'
  itineraryPlanning: '${apim.outputs.gatewayUrl}/mcp/itinerary-planning'
  echoPing: '${apim.outputs.gatewayUrl}/mcp/echo-ping'
  webSearch: '${apim.outputs.gatewayUrl}/mcp/web-search'
  modelInference: '${apim.outputs.gatewayUrl}/mcp/model-inference'
  codeEvaluation: '${apim.outputs.gatewayUrl}/mcp/code-evaluation'
}