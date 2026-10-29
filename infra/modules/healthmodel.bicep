@description('Name of the health model.')
param name string

@description('Region that supports Microsoft.CloudHealth/healthmodels. Can differ from the monitored resources.')
param location string

param tags object = {}

@description('AI Services account used for generation and destination recommendations.')
param aiAccountName string

@description('Log Analytics workspace that receives the Container Apps console logs.')
param logAnalyticsWorkspaceName string

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsWorkspaceName
}

resource model 'Microsoft.CloudHealth/healthmodels@2026-11-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {}
}

// Reader on the resource group for metrics and Resource Health.
resource reader 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, model.id, 'healthmodel-reader')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7')
    principalId: model.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Monitoring Reader on the workspace for the log queries.
resource workspaceReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: workspace
  name: guid(workspace.id, model.id, 'healthmodel-monitoring-reader')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '43d0d8ad-25c7-4714-9337-8ba259a9fe05')
    principalId: model.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource authentication 'Microsoft.CloudHealth/healthmodels/authenticationsettings@2026-11-01' = {
  parent: model
  name: 'system-assigned'
  properties: {
    authenticationKind: 'ManagedIdentity'
    managedIdentityName: 'SystemAssigned'
  }
  dependsOn: [
    reader
    workspaceReader
  ]
}

var containerNamespace = 'Microsoft.App/containerApps'
var aiNamespace = 'Microsoft.CognitiveServices/accounts'

resource replicas 'Microsoft.CloudHealth/healthmodels/signaldefinitions@2026-11-01' = {
  parent: model
  name: 'replicas'
  properties: {
    signalKind: 'AzureResourceMetric'
    displayName: 'Running replicas'
    metricNamespace: containerNamespace
    metricName: 'Replicas'
    aggregationType: 'Average'
    dataUnit: 'Count'
    timeGrain: 'PT5M'
    refreshInterval: 'PT1M'
    evaluationRules: {
      degradedRule: {
        operator: 'LessThan'
        threshold: 1
      }
      unhealthyRule: {
        operator: 'LessThan'
        threshold: json('0.5')
      }
    }
  }
}

resource aiAvailability 'Microsoft.CloudHealth/healthmodels/signaldefinitions@2026-11-01' = {
  parent: model
  name: 'ai-availability'
  properties: {
    signalKind: 'AzureResourceMetric'
    displayName: 'AI request availability'
    metricNamespace: aiNamespace
    metricName: 'AzureOpenAIAvailabilityRate'
    aggregationType: 'Average'
    dataUnit: 'Percent'
    timeGrain: 'PT5M'
    refreshInterval: 'PT1M'
    evaluationRules: {
      degradedRule: {
        operator: 'LessThan'
        threshold: 99
      }
      unhealthyRule: {
        operator: 'LessThan'
        threshold: 95
      }
    }
  }
}

var journeyName = 'plan-trip'
var componentDefinitions = [
  { name: 'interface', displayName: 'Chat interface' }
  { name: 'assistant', displayName: 'Assistant coordination' }
  { name: 'preferences', displayName: 'Customer preferences' }
  { name: 'destinations', displayName: 'Destination recommendations' }
  { name: 'itinerary', displayName: 'Itinerary planning' }
  { name: 'generation', displayName: 'AI generation' }
]

// The three assistants and the two destination sources are alternatives.
var bindings = [
  { name: 'interface', component: 'interface', resourceName: 'ui-angular', ai: false }
  { name: 'assistant-langchain', component: 'assistant', resourceName: 'api-langchain-js', ai: false }
  { name: 'assistant-llamaindex', component: 'assistant', resourceName: 'api-llamaindex-ts', ai: false }
  { name: 'assistant-python', component: 'assistant', resourceName: 'api-maf-python', ai: false }
  { name: 'preferences', component: 'preferences', resourceName: 'mcp-customer-query', ai: false }
  { name: 'destinations-mcp', component: 'destinations', resourceName: 'mcp-destination-recommendation', ai: false }
  { name: 'destinations-ai', component: 'destinations', resourceName: aiAccountName, ai: true }
  { name: 'itinerary', component: 'itinerary', resourceName: 'mcp-itinerary-planning', ai: false }
  { name: 'generation', component: 'generation', resourceName: aiAccountName, ai: true }
]

// Error messages the assistants log when a chat or a required tool fails.
// Python logs request errors to stdout through its OpenTelemetry console exporter, so both streams are searched.
var assistantErrors = [
  'Error during streaming'
  'Error occurred:'
  'Error in workflow execution'
  'Error processing chat request'
  'Error fetching MCP tools'
  'Error initializing workflow'
  'Service error in workflow'
  'Service error in Magentic workflow'
  'Error streaming workflow events'
  'Error in Magentic workflow'
  'ImportError:'
  'ModuleNotFoundError:'
]
var errorClause = join(map(assistantErrors, e => 'Log_s contains \'${e}\''), ' or ')

// The Python assistant uses AI for destinations, so only it ignores the destination server.
func requiredToolClause(resourceName string) string =>
  '(Log_s contains \'is not reachable\' and (Log_s contains \'Customer Query\' or Log_s contains \'Itinerary Planning\'${resourceName == 'api-maf-python' ? '' : ' or Log_s contains \'Destination Recommendation\''})) or (Log_s contains \'Error creating MCP tools for \' and (Log_s contains \'customer-query\' or Log_s contains \'itinerary-planning\'${resourceName == 'api-maf-python' ? '' : ' or Log_s contains \'destination-recommendation\''}))'

resource journey 'Microsoft.CloudHealth/healthmodels/entities@2026-11-01' = {
  parent: model
  name: journeyName
  properties: {
    displayName: 'Plan a trip'
    icon: {
      iconName: 'UserFlow'
    }
    healthObjective: json('99.9')
    alerts: {
      degraded: {
        severity: 'Sev2'
        description: 'Plan a trip has diminished functionality'
      }
      unhealthy: {
        severity: 'Sev1'
        description: 'Plan a trip is unavailable'
      }
    }
    signalGroups: {
      dependencies: {
        aggregationType: 'WorstOf'
      }
    }
  }
}

resource components 'Microsoft.CloudHealth/healthmodels/entities@2026-11-01' = [
  for component in componentDefinitions: {
    parent: model
    name: component.name
    properties: {
      displayName: component.displayName
      icon: {
        iconName: 'SystemComponent'
      }
      signalGroups: {
        // One non-healthy alternative degrades the component; all of them make it unhealthy.
        dependencies: component.name == 'assistant' || component.name == 'destinations'
          ? {
              aggregationType: 'MaxNotHealthy'
              unit: 'Absolute'
              degradedThreshold: 1
              unhealthyThreshold: component.name == 'assistant' ? 3 : 2
              ignoreUnknown: true
            }
          : {
              aggregationType: 'WorstOf'
            }
      }
    }
  }
]

resource resources 'Microsoft.CloudHealth/healthmodels/entities@2026-11-01' = [
  for binding in bindings: {
    parent: model
    name: '${binding.name}-resource'
    properties: {
      displayName: '${binding.ai ? 'AI Services' : 'Container App'}: ${binding.resourceName} (${binding.name})'
      signalGroups: union(
        {
          azureResource: {
            authenticationSetting: authentication.name
            azureResourceId: resourceId(binding.ai ? aiNamespace : containerNamespace, binding.resourceName)
            signals: [
              {
                name: binding.ai ? aiAvailability.name : replicas.name
                signalKind: 'AzureResourceMetric'
                signalDefinitionName: binding.ai ? aiAvailability.name : replicas.name
              }
            ]
            resourceHealth: {
              enabled: binding.ai ? 'Enabled' : 'Disabled'
            }
          }
        },
        binding.ai
          ? {}
          : {
              azureLogAnalytics: {
                authenticationSetting: authentication.name
                logAnalyticsWorkspaceResourceId: workspace.id
                signals: concat(
                  [
                    {
                      // Planned revision replacements are not logged as ProcessExited.
                      name: 'container-crashes'
                      signalKind: 'LogAnalyticsQuery'
                      displayName: 'Container crashes'
                      queryText: 'ContainerAppSystemLogs_CL | where TimeGenerated > ago(5m) | where ContainerAppName_s == \'${binding.resourceName}\' | where Reason_s == \'ContainerTerminated\' and Log_s contains "reason \'ProcessExited\'" and Log_s !contains "exit code \'0\'" | summarize crashes=count()'
                      valueColumnName: 'crashes'
                      timeGrain: 'PT5M'
                      refreshInterval: 'PT1M'
                      dataUnit: 'Count'
                      evaluationRules: {
                        degradedRule: {
                          operator: 'GreaterThan'
                          threshold: 0
                        }
                        unhealthyRule: {
                          operator: 'GreaterThan'
                          threshold: 3
                        }
                      }
                    }
                  ],
                  binding.component == 'assistant'
                    ? [
                        {
                          name: 'logged-assistant-failures'
                          signalKind: 'LogAnalyticsQuery'
                          displayName: 'Logged assistant or required tool failures'
                          queryText: 'ContainerAppConsoleLogs_CL | where TimeGenerated > ago(5m) | where ContainerAppName_s == \'${binding.resourceName}\' | where ${errorClause} or ${requiredToolClause(binding.resourceName)} | summarize failures=count()'
                          valueColumnName: 'failures'
                          timeGrain: 'PT5M'
                          refreshInterval: 'PT1M'
                          dataUnit: 'Count'
                          evaluationRules: {
                            degradedRule: {
                              operator: 'GreaterThan'
                              threshold: 0
                            }
                            unhealthyRule: {
                              operator: 'GreaterThan'
                              threshold: 3
                            }
                          }
                        }
                      ]
                    : []
                )
              }
            }
      )
    }
  }
]

var edges = concat(
  [{ parent: name, child: journeyName }],
  map(componentDefinitions, component => { parent: journeyName, child: component.name }),
  map(bindings, binding => { parent: binding.component, child: '${binding.name}-resource' })
)

resource relationships 'Microsoft.CloudHealth/healthmodels/relationships@2026-11-01' = [
  for edge in edges: {
    parent: model
    name: '${edge.parent}-${edge.child}'
    properties: {
      parentEntityName: edge.parent
      childEntityName: edge.child
    }
    dependsOn: [
      journey
      components
      resources
    ]
  }
]

output healthModelName string = model.name
output healthModelId string = model.id
