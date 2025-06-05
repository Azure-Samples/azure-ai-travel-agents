# Development Guide

This comprehensive guide provides developers with everything needed to contribute to, extend, and customize the Azure AI Travel Agents system.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Adding New Features](#adding-new-features)
5. [Testing Strategy](#testing-strategy)
6. [Debugging Guide](#debugging-guide)
7. [Code Standards](#code-standards)
8. [Performance Guidelines](#performance-guidelines)
9. [Contributing Guidelines](#contributing-guidelines)

## Development Environment Setup

### Prerequisites

#### Required Software
```bash
# Node.js (version 22.16+)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # v22.16.0+
npm --version   # 10.0.0+

# Docker (latest stable)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify Docker
docker --version  # 24.0.0+
docker-compose --version  # 2.20.0+

# Git (2.40+)
sudo apt-get install git
git --version

# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az --version

# Azure Developer CLI
curl -fsSL https://aka.ms/install-azd.sh | bash
azd version
```

#### Development Tools
```bash
# VS Code (recommended IDE)
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code

# VS Code Extensions (recommended)
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension angular.ng-template
code --install-extension ms-vscode.vscode-docker
code --install-extension ms-azuretools.vscode-bicep
code --install-extension ms-vscode.azure-account
```

#### Optional Tools
```bash
# For Python MCP servers
python3 --version  # 3.11+
pip3 install --user pipenv

# For Java MCP servers  
sudo apt-get install openjdk-21-jdk
java --version

# For .NET MCP servers
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0
```

### Repository Setup

#### 1. Clone and Initialize
```bash
# Clone repository
git clone https://github.com/Azure-Samples/azure-ai-travel-agents.git
cd azure-ai-travel-agents

# Set up Git hooks (optional)
cp .github/hooks/* .git/hooks/
chmod +x .git/hooks/*

# Install dependencies
npm install --prefix src/api
npm install --prefix src/ui

# Verify setup
npm run health-check --prefix src/api
```

#### 2. Environment Configuration
```bash
# Create environment files
cp src/api/.env.sample src/api/.env
cp src/ui/.env.sample src/ui/.env

# Configure Azure services (run azd provision first)
azd auth login
azd provision

# The provision command will populate your .env files automatically
```

#### 3. IDE Configuration

**VS Code Settings (.vscode/settings.json)**:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.angular": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.angular": true
  },
  "eslint.workingDirectories": [
    "src/api",
    "src/ui"
  ],
  "docker.defaultRegistry": "your-acr.azurecr.io"
}
```

**Launch Configuration (.vscode/launch.json)**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/api/src/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "tsx/cjs"],
      "cwd": "${workspaceFolder}/src/api",
      "console": "integratedTerminal",
      "sourceMaps": true,
      "restart": true,
      "envFile": "${workspaceFolder}/src/api/.env"
    },
    {
      "name": "Debug UI",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/ui/node_modules/@angular/cli/bin/ng",
      "args": ["serve", "--source-map"],
      "cwd": "${workspaceFolder}/src/ui",
      "console": "integratedTerminal"
    }
  ]
}
```

## Project Structure

### High-Level Architecture
```
azure-ai-travel-agents/
├── .github/                    # GitHub workflows and templates
│   ├── workflows/              # CI/CD pipelines
│   └── hooks/                  # Git hooks
├── docs/                       # Documentation
│   ├── technical-architecture.md
│   ├── flow-diagrams.md
│   ├── mcp-servers.md
│   ├── api-documentation.md
│   ├── deployment-architecture.md
│   └── development-guide.md
├── infra/                      # Infrastructure as Code (Bicep)
│   ├── main.bicep              # Main infrastructure template
│   ├── modules/                # Reusable Bicep modules
│   └── parameters/             # Environment-specific parameters
├── src/                        # Source code
│   ├── api/                    # Express.js API server
│   ├── ui/                     # Angular frontend
│   ├── tools/                  # MCP servers
│   ├── shared/                 # Shared utilities and types
│   └── docker-compose.yml      # Local development environment
├── azure.yaml                  # Azure Developer CLI configuration
├── README.md                   # Project overview
└── CONTRIBUTING.md             # Contribution guidelines
```

### API Structure (src/api/)
```
src/api/
├── src/
│   ├── index.ts                # Main server entry point
│   ├── mcp/                    # MCP client implementations
│   │   ├── mcp-tools.ts        # Tool discovery and management
│   │   ├── mcp-http-client.ts  # HTTP MCP client
│   │   └── mcp-sse-client.ts   # SSE MCP client
│   ├── orchestrator/           # Agent orchestration
│   │   └── llamaindex/         # LlamaIndex.TS integration
│   │       ├── index.ts        # Agent setup and coordination
│   │       ├── providers/      # LLM providers
│   │       └── tools/          # Tool configurations
│   └── utils/                  # Shared utilities
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── Dockerfile                  # Container image definition
├── .env.sample                 # Environment template
└── .env                        # Local environment (git-ignored)
```

### UI Structure (src/ui/)
```
src/ui/
├── src/
│   ├── app/                    # Angular application
│   │   ├── components/         # Reusable components
│   │   ├── services/           # Application services
│   │   ├── models/             # TypeScript interfaces
│   │   └── pages/              # Route components
│   ├── assets/                 # Static assets
│   ├── environments/           # Environment configurations
│   └── styles/                 # Global styles
├── angular.json                # Angular CLI configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── Dockerfile                  # Container image definition
└── .env.sample                 # Environment template
```

### MCP Tools Structure (src/tools/)
```
src/tools/
├── echo-ping/                  # TypeScript/Node.js example
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── server.ts           # MCP server implementation
│   │   └── tools.ts            # Tool definitions
│   ├── package.json
│   ├── Dockerfile
│   └── .env.sample
├── customer-query/             # C#/.NET implementation
│   ├── AITravelAgent.CustomerQueryServer/
│   │   ├── Program.cs          # Server entry point
│   │   ├── Controllers/        # API controllers
│   │   └── Services/           # Business logic
│   ├── AITravelAgent.sln       # Solution file
│   └── Dockerfile
├── destination-recommendation/ # Java/Spring Boot
├── itinerary-planning/         # Python/FastAPI
├── code-evaluation/            # Python
├── model-inference/            # Python with ONNX/vLLM
└── web-search/                 # TypeScript/Node.js
```

## Development Workflow

### Daily Development Process

#### 1. Start Development Environment
```bash
# Option A: Full Docker environment
cd src
docker-compose up -d
# Access UI at http://localhost:4200
# Access API at http://localhost:4000

# Option B: Local services
# Terminal 1: Start API
cd src/api
npm start

# Terminal 2: Start UI
cd src/ui
npm start

# Terminal 3: Start monitoring (optional)
docker run -d --name aspire-dashboard \
  -p 18888:18888 -p 18889:18889 \
  -e DOTNET_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true \
  mcr.microsoft.com/dotnet/aspire-dashboard:9.1
```

#### 2. Development Cycle
```bash
# Create feature branch
git checkout -b feature/new-travel-feature

# Make changes and test locally
npm run test --prefix src/api
npm run test --prefix src/ui

# Build and verify
npm run build --prefix src/api
npm run build --prefix src/ui

# Commit changes
git add .
git commit -m "feat: add new travel feature"

# Push and create PR
git push origin feature/new-travel-feature
```

#### 3. Testing and Validation
```bash
# Run all tests
npm run test:all

# Check code quality
npm run lint --prefix src/api
npm run lint --prefix src/ui

# Type checking
npm run type-check --prefix src/api
npm run type-check --prefix src/ui

# Integration tests
npm run test:integration
```

### Git Workflow

#### Branch Strategy
```
main                    # Production-ready code
├── develop             # Integration branch
├── feature/*           # Feature development
├── bugfix/*            # Bug fixes
├── hotfix/*            # Production hotfixes
└── release/*           # Release preparation
```

#### Commit Convention
```bash
# Format: type(scope): description
feat(api): add new MCP server integration
fix(ui): resolve chat streaming issue
docs(mcp): update server implementation guide
refactor(api): improve error handling
test(ui): add component unit tests
chore(deps): update dependencies
```

#### Pre-commit Hooks
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Lint check
npm run lint --prefix src/api --silent
if [ $? -ne 0 ]; then
  echo "❌ API linting failed"
  exit 1
fi

npm run lint --prefix src/ui --silent
if [ $? -ne 0 ]; then
  echo "❌ UI linting failed"
  exit 1
fi

# Type check
npm run type-check --prefix src/api --silent
if [ $? -ne 0 ]; then
  echo "❌ API type checking failed"
  exit 1
fi

# Unit tests
npm run test --prefix src/api --silent
if [ $? -ne 0 ]; then
  echo "❌ API tests failed"
  exit 1
fi

echo "✅ All pre-commit checks passed"
```

## Adding New Features

### Adding a New MCP Server

#### 1. Create Server Structure
```bash
# Create new MCP server directory
mkdir src/tools/my-new-server
cd src/tools/my-new-server

# Initialize based on technology choice
# For TypeScript (similar to echo-ping):
cp -r ../echo-ping/* .
# For Python (similar to code-evaluation):
cp -r ../code-evaluation/* .
# For Java (similar to destination-recommendation):
cp -r ../destination-recommendation/* .
# For C# (similar to customer-query):
cp -r ../customer-query/* .
```

#### 2. Implement MCP Server (TypeScript Example)
```typescript
// src/tools/my-new-server/src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export class MyNewMCPServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "my-new-server",
      version: "1.0.0"
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "my_custom_tool",
            description: "Performs custom business logic",
            inputSchema: {
              type: "object",
              properties: {
                input: {
                  type: "string",
                  description: "Input data for processing"
                },
                options: {
                  type: "object",
                  description: "Optional configuration"
                }
              },
              required: ["input"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "my_custom_tool":
          return await this.handleCustomTool(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleCustomTool(args: any) {
    // Implement your custom business logic here
    const result = await this.processCustomLogic(args.input, args.options);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result)
        }
      ]
    };
  }

  private async processCustomLogic(input: string, options?: any) {
    // Your implementation here
    return {
      processed_input: input.toUpperCase(),
      timestamp: new Date().toISOString(),
      options: options || {}
    };
  }

  getServer() {
    return this.server;
  }
}
```

#### 3. Update Docker Configuration
```dockerfile
# src/tools/my-new-server/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build if needed
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["npm", "start"]
```

#### 4. Register in Docker Compose
```yaml
# src/docker-compose.yml - add to services section
tool-my-new-server:
  container_name: tool-my-new-server
  build: ./tools/my-new-server
  ports:
    - "5008:3000"
  environment:
    - OTEL_SERVICE_NAME=tool-my-new-server
    - OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889
  depends_on:
    - aspire-dashboard
  env_file:
    - "./tools/my-new-server/.env"
    - "./tools/my-new-server/.env.docker"
```

#### 5. Register in API
```typescript
// src/api/src/orchestrator/llamaindex/tools/index.ts
export type McpServerName =
  | "echo-ping"
  | "customer-query"
  | "web-search"
  | "itinerary-planning"
  | "model-inference"
  | "code-evaluation"
  | "destination-recommendation"
  | "my-new-server";  // Add new server

export const McpToolsConfig = (): {
  [k in McpServerName]: McpServerDefinition;
} => ({
  // ... existing servers
  "my-new-server": {
    config: {
      url: process.env["MCP_MY_NEW_SERVER_URL"] + MCP_API_HTTP_PATH,
      type: "http",
      verbose: true,
    },
    id: "my-new-server",
    name: "My New Server",
  },
});
```

#### 6. Add Agent Integration
```typescript
// src/api/src/orchestrator/llamaindex/index.ts
export async function setupAgents(filteredTools: McpServerDefinition[] = []) {
  // ... existing code

  if (tools["my-new-server"]) {
    const mcpServerConfig = mcpToolsConfig["my-new-server"];
    const tools = await mcp(mcpServerConfig.config).tools();
    
    const myNewAgent = agent({
      name: "MyNewAgent",
      systemPrompt: "Specialized agent for my new functionality. Always be helpful and accurate.",
      tools,
      llm,
      verbose,
    });
    
    agentsList.push(myNewAgent);
    handoffTargets.push(myNewAgent);
    toolsList.push(...tools);
  }

  // ... rest of function
}
```

### Adding New UI Components

#### 1. Create Component
```bash
# Generate new component
cd src/ui
ng generate component components/my-new-component

# Generate service if needed
ng generate service services/my-new-service
```

#### 2. Implement Component
```typescript
// src/ui/src/app/components/my-new-component/my-new-component.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-new-component',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="my-component">
      <h3>{{ title }}</h3>
      <div class="content">
        <ng-content></ng-content>
      </div>
      <button 
        (click)="handleAction()" 
        class="btn btn-primary"
        [disabled]="loading">
        {{ loading ? 'Processing...' : 'Action' }}
      </button>
    </div>
  `,
  styles: [`
    .my-component {
      @apply p-4 border rounded-lg shadow-sm;
    }
    .content {
      @apply my-4;
    }
    .btn {
      @apply px-4 py-2 rounded font-medium;
    }
    .btn-primary {
      @apply bg-blue-600 text-white hover:bg-blue-700;
    }
    .btn:disabled {
      @apply opacity-50 cursor-not-allowed;
    }
  `]
})
export class MyNewComponentComponent implements OnInit {
  @Input() title: string = 'Default Title';
  @Input() data: any;
  @Output() actionComplete = new EventEmitter<any>();

  loading = false;

  ngOnInit() {
    // Initialization logic
  }

  async handleAction() {
    this.loading = true;
    try {
      // Perform action
      const result = await this.processAction();
      this.actionComplete.emit(result);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      this.loading = false;
    }
  }

  private async processAction(): Promise<any> {
    // Implementation
    return { success: true };
  }
}
```

#### 3. Add to Module/Route
```typescript
// src/ui/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MyNewComponentComponent } from './components/my-new-component/my-new-component.component';

export const routes: Routes = [
  // ... existing routes
  {
    path: 'my-new-feature',
    component: MyNewComponentComponent,
    title: 'My New Feature'
  }
];
```

### Adding New API Endpoints

#### 1. Define Route Handler
```typescript
// src/api/src/routes/my-new-routes.ts
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Request validation schemas
const MyRequestSchema = z.object({
  data: z.string(),
  options: z.object({
    format: z.enum(['json', 'xml']).optional()
  }).optional()
});

// POST /api/my-new-endpoint
router.post('/my-new-endpoint', async (req, res) => {
  try {
    // Validate request
    const validated = MyRequestSchema.parse(req.body);
    
    // Process request
    const result = await processMyNewFeature(validated);
    
    // Return response
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/my-new-endpoint/:id
router.get('/my-new-endpoint/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getMyNewData(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

async function processMyNewFeature(data: any): Promise<any> {
  // Implementation
  return { processed: true, result: data };
}

async function getMyNewData(id: string): Promise<any> {
  // Implementation
  return { id, data: 'example' };
}

export default router;
```

#### 2. Register Routes
```typescript
// src/api/src/index.ts
import myNewRoutes from './routes/my-new-routes.js';

// ... existing code

// Register new routes
apiRouter.use('/my-new', myNewRoutes);

// ... rest of server setup
```

## Testing Strategy

### Unit Testing

#### API Unit Tests
```typescript
// src/api/src/__tests__/mcp-tools.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mcpToolsList } from '../mcp/mcp-tools.js';

describe('MCP Tools', () => {
  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup
  });

  it('should list all available tools', async () => {
    const mockConfig = [
      {
        id: 'test-server',
        name: 'Test Server',
        config: {
          url: 'http://localhost:3000/mcp',
          type: 'http' as const,
          verbose: false
        }
      }
    ];

    const tools = await mcpToolsList(mockConfig);
    
    expect(tools).toHaveLength(1);
    expect(tools[0].id).toBe('test-server');
    expect(tools[0].reachable).toBeDefined();
  });

  it('should handle unreachable servers gracefully', async () => {
    const mockConfig = [
      {
        id: 'unreachable-server',
        name: 'Unreachable Server',
        config: {
          url: 'http://nonexistent:3000/mcp',
          type: 'http' as const,
          verbose: false
        }
      }
    ];

    const tools = await mcpToolsList(mockConfig);
    
    expect(tools[0].reachable).toBe(false);
    expect(tools[0].error).toBeDefined();
  });
});
```

#### UI Unit Tests
```typescript
// src/ui/src/app/components/my-component/my-component.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyNewComponentComponent } from './my-new-component.component';

describe('MyNewComponentComponent', () => {
  let component: MyNewComponentComponent;
  let fixture: ComponentFixture<MyNewComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyNewComponentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MyNewComponentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit action complete event', async () => {
    spyOn(component.actionComplete, 'emit');
    
    await component.handleAction();
    
    expect(component.actionComplete.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ success: true })
    );
  });

  it('should handle loading state', async () => {
    expect(component.loading).toBe(false);
    
    const actionPromise = component.handleAction();
    expect(component.loading).toBe(true);
    
    await actionPromise;
    expect(component.loading).toBe(false);
  });
});
```

### Integration Testing

#### API Integration Tests
```typescript
// src/api/src/__tests__/integration/chat.test.ts
import request from 'supertest';
import { app } from '../index.js';

describe('Chat API Integration', () => {
  it('should process chat request with tools', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'Plan a trip to Tokyo',
        tools: [
          {
            id: 'echo-ping',
            name: 'Echo Test',
            selected: true
          }
        ]
      })
      .expect(200);

    // For SSE responses, check headers
    expect(response.headers['content-type']).toContain('text/event-stream');
  });

  it('should validate request body', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        // Missing required fields
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
```

#### E2E Testing
```typescript
// e2e/tests/user-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Travel Planning User Journey', () => {
  test('should complete full travel planning flow', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:4200');

    // Enter travel query
    await page.fill('[data-testid="message-input"]', 'Plan a 5-day trip to Paris');

    // Select tools
    await page.check('[data-testid="tool-destination-recommendation"]');
    await page.check('[data-testid="tool-itinerary-planning"]');

    // Submit request
    await page.click('[data-testid="submit-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="response-content"]', {
      timeout: 30000
    });

    // Verify response contains expected content
    const responseText = await page.textContent('[data-testid="response-content"]');
    expect(responseText).toContain('Paris');
    expect(responseText).toContain('itinerary');
  });

  test('should handle tool selection changes', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Initially no tools selected
    const selectedTools = await page.$$('[data-testid^="tool-"]:checked');
    expect(selectedTools.length).toBe(0);

    // Select tools
    await page.check('[data-testid="tool-echo-ping"]');
    await page.check('[data-testid="tool-web-search"]');

    // Verify selection
    const newSelectedTools = await page.$$('[data-testid^="tool-"]:checked');
    expect(newSelectedTools.length).toBe(2);
  });
});
```

### Performance Testing

#### Load Testing
```typescript
// tests/performance/load-test.ts
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function() {
  const payload = JSON.stringify({
    message: 'Plan a quick weekend trip',
    tools: [
      { id: 'echo-ping', name: 'Echo Test', selected: true }
    ]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post('http://localhost:4000/api/chat', payload, params);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });
}
```

## Debugging Guide

### API Debugging

#### Using VS Code Debugger
```typescript
// Set breakpoints in your code and use the Debug API configuration
// Launch configuration already provided in .vscode/launch.json

// Example debugging session
const result = await mcpToolsList(toolConfigs);
// Set breakpoint here to inspect result
console.log('Tools result:', result);
```

#### Using Node.js Inspector
```bash
# Start API with inspector
cd src/api
npm run debug

# Connect Chrome DevTools
# Navigate to chrome://inspect in Chrome browser
# Click "Open dedicated DevTools for Node"
```

#### Logging and Tracing
```typescript
// src/api/src/utils/logger.ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('api-debug');

export function debugLog(message: string, data?: any) {
  const span = tracer.startSpan('debug-log');
  
  console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
  
  span.addEvent('debug-log', {
    message,
    data: JSON.stringify(data)
  });
  
  span.end();
}

// Usage in your code
debugLog('Processing MCP tool call', { toolName, args });
```

### MCP Server Debugging

#### Docker Container Debugging
```bash
# View logs for specific MCP server
docker-compose logs -f tool-echo-ping

# Execute commands inside container
docker-compose exec tool-echo-ping /bin/sh

# Debug network connectivity
docker-compose exec web-api ping tool-echo-ping
docker-compose exec web-api curl http://tool-echo-ping:3000/health
```

#### MCP Protocol Debugging
```typescript
// Enable verbose logging for MCP clients
const mcpClient = new MCPHTTPClient(
  "debug-client",
  serverUrl,
  accessToken,
  { verbose: true }  // Enable detailed logging
);

// Log all MCP communication
mcpClient.on('request', (request) => {
  console.log('MCP Request:', JSON.stringify(request, null, 2));
});

mcpClient.on('response', (response) => {
  console.log('MCP Response:', JSON.stringify(response, null, 2));
});
```

### UI Debugging

#### Angular DevTools
```bash
# Install Angular DevTools browser extension
# Available for Chrome and Firefox

# Use Angular CLI in debug mode
cd src/ui
ng serve --source-map --verbose
```

#### Browser Developer Tools
```typescript
// Add debugging helpers to your component
export class MyComponent {
  ngOnInit() {
    // Add component to global scope for debugging
    (window as any).debugComponent = this;
    
    // Log component state
    console.log('Component initialized:', this);
  }
  
  // Add debug method
  debug() {
    return {
      state: this.getState(),
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    };
  }
}

// In browser console:
// debugComponent.debug()
```

#### Network Debugging
```typescript
// src/ui/src/app/services/api.service.ts
export class ApiService {
  async streamChatMessage(message: string, tools: Tools[]) {
    // Add request/response logging
    console.log('API Request:', { message, tools });
    
    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, tools }),
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);

      // ... rest of implementation
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}
```

## Code Standards

### TypeScript Standards

#### Naming Conventions
```typescript
// Use PascalCase for classes and interfaces
class TravelAgentService {}
interface UserPreferences {}

// Use camelCase for variables, functions, and methods
const userName = 'john';
function processRequest() {}

// Use SCREAMING_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;
const API_ENDPOINTS = {
  CHAT: '/api/chat',
  TOOLS: '/api/tools'
} as const;

// Use kebab-case for file names
// good: travel-agent.service.ts
// bad: TravelAgentService.ts
```

#### Code Structure
```typescript
// File organization
import { standardLibraries } from 'node:path';
import { thirdPartyLibraries } from 'express';
import { localImports } from './local-file.js';

// Type definitions first
interface RequestData {
  message: string;
  tools: ToolSelection[];
}

// Constants
const DEFAULT_TIMEOUT = 30000;

// Main implementation
export class ServiceClass {
  // Private properties first
  private readonly config: Config;
  
  // Public properties
  public readonly name: string;
  
  // Constructor
  constructor(config: Config) {
    this.config = config;
    this.name = config.serviceName;
  }
  
  // Public methods
  public async processRequest(data: RequestData): Promise<Response> {
    // Implementation
  }
  
  // Private methods last
  private validateRequest(data: RequestData): boolean {
    // Implementation
  }
}
```

#### Error Handling
```typescript
// Create custom error classes
export class MCPServerError extends Error {
  constructor(
    message: string,
    public readonly serverName: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'MCPServerError';
  }
}

// Use proper error handling patterns
async function callMCPTool(toolName: string, args: unknown): Promise<ToolResult> {
  try {
    const result = await mcpClient.callTool(toolName, args);
    return result;
  } catch (error) {
    if (error instanceof MCPServerError) {
      // Handle MCP-specific errors
      throw error;
    } else if (error instanceof Error) {
      // Wrap unknown errors
      throw new MCPServerError(
        `Tool call failed: ${error.message}`,
        toolName,
        error
      );
    } else {
      // Handle non-Error objects
      throw new MCPServerError(
        `Tool call failed with unknown error`,
        toolName
      );
    }
  }
}
```

### Angular Standards

#### Component Structure
```typescript
@Component({
  selector: 'app-travel-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Template content -->
  `,
  styles: [`
    /* Component-specific styles */
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelPlannerComponent implements OnInit, OnDestroy {
  // Input properties
  @Input() config!: PlannerConfig;
  
  // Output events
  @Output() planCompleted = new EventEmitter<TravelPlan>();
  
  // ViewChild references
  @ViewChild('plannerForm') plannerForm!: ElementRef;
  
  // Public properties (template-bound)
  isLoading = signal(false);
  travelPlan = signal<TravelPlan | null>(null);
  
  // Private properties
  private destroy$ = new Subject<void>();
  
  constructor(
    private apiService: ApiService,
    private cd: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.initializeComponent();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Public methods (template-bound)
  onSubmitPlan(formData: FormData) {
    // Implementation
  }
  
  // Private methods
  private initializeComponent() {
    // Implementation
  }
}
```

#### Service Structure
```typescript
@Injectable({
  providedIn: 'root'
})
export class TravelPlanService {
  private readonly apiUrl = environment.apiServerUrl;
  private readonly httpClient = inject(HttpClient);
  
  // Public methods
  async createTravelPlan(preferences: TravelPreferences): Promise<TravelPlan> {
    return firstValueFrom(
      this.httpClient.post<TravelPlan>(`${this.apiUrl}/api/travel-plans`, preferences)
        .pipe(
          timeout(30000),
          retry(3),
          catchError(this.handleError)
        )
    );
  }
  
  // Private methods
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('Service error:', error);
    return throwError(() => new Error('Service operation failed'));
  };
}
```

### Documentation Standards

#### JSDoc Comments
```typescript
/**
 * Processes a travel query using AI agents and MCP tools
 * 
 * @param message - The user's travel query in natural language
 * @param tools - Selected MCP tools to use for processing
 * @param options - Optional configuration for the request
 * @returns A stream of processing events and final result
 * 
 * @example
 * ```typescript
 * const stream = await processTravelQuery(
 *   "Plan a 5-day trip to Japan",
 *   [{ id: "destination-recommendation", selected: true }],
 *   { timeout: 30000 }
 * );
 * 
 * for await (const event of stream) {
 *   console.log('Processing event:', event);
 * }
 * ```
 * 
 * @throws {ValidationError} When input parameters are invalid
 * @throws {MCPServerError} When MCP tool communication fails
 */
export async function processTravelQuery(
  message: string,
  tools: ToolSelection[],
  options?: ProcessingOptions
): Promise<AsyncIterable<ProcessingEvent>> {
  // Implementation
}
```

#### README Documentation
```markdown
# Component/Service Name

Brief description of what this component/service does.

## Usage

```typescript
// Basic usage example
const service = new MyService(config);
const result = await service.processData(input);
```

## API Reference

### Methods

#### `processData(input: InputData): Promise<OutputData>`

Processes the input data and returns the result.

**Parameters:**
- `input` (InputData): The data to process

**Returns:**
- Promise<OutputData>: The processed result

**Throws:**
- `ValidationError`: When input is invalid

## Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| timeout | number | 30000 | Request timeout in milliseconds |
| retries | number | 3 | Number of retry attempts |

## Examples

See examples in the `examples/` directory.
```

## Performance Guidelines

### API Performance

#### Response Time Optimization
```typescript
// Use streaming for long-running operations
export async function* processLongRunningTask(
  input: InputData
): AsyncGenerator<ProgressEvent, FinalResult> {
  yield { type: 'progress', message: 'Starting processing...' };
  
  // Process in chunks
  for (const chunk of input.chunks) {
    const result = await processChunk(chunk);
    yield { type: 'progress', data: result };
  }
  
  yield { type: 'complete', result: finalResult };
}

// Implement caching for expensive operations
const cache = new Map<string, CachedResult>();

async function expensiveOperation(key: string): Promise<Result> {
  const cached = cache.get(key);
  if (cached && !isCacheExpired(cached)) {
    return cached.result;
  }
  
  const result = await performExpensiveCalculation(key);
  cache.set(key, { result, timestamp: Date.now() });
  return result;
}
```

#### Memory Management
```typescript
// Use proper cleanup for event listeners and subscriptions
export class EventManager {
  private subscriptions: Subscription[] = [];
  
  subscribe(event: Observable<any>) {
    const sub = event.subscribe(handler);
    this.subscriptions.push(sub);
    return sub;
  }
  
  cleanup() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}

// Avoid memory leaks in long-running processes
async function processLargeDataset(data: LargeDataset) {
  const batchSize = 1000;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await processBatch(batch);
    
    // Allow garbage collection
    if (i % 10000 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
```

### UI Performance

#### Change Detection Optimization
```typescript
// Use OnPush change detection strategy
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  // Use signals for reactive data
  data = signal<Data[]>([]);
  
  // Use computed for derived state
  filteredData = computed(() => 
    this.data().filter(item => item.isVisible)
  );
  
  // Use trackBy for ngFor
  trackById(index: number, item: DataItem): string {
    return item.id;
  }
}
```

#### Bundle Size Optimization
```typescript
// Use lazy loading for routes
const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent)
  }
];

// Use dynamic imports for heavy libraries
async function loadHeavyLibrary() {
  const { HeavyLibrary } = await import('heavy-library');
  return new HeavyLibrary();
}
```

## Contributing Guidelines

### Pull Request Process

1. **Fork and Branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Follow Code Standards**
   - Run linting: `npm run lint`
   - Run tests: `npm run test`
   - Update documentation

3. **Commit Message Format**
   ```
   type(scope): description
   
   Detailed description of changes made.
   
   Fixes #123
   ```

4. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   ```

5. **Review Process**
   - At least one approved review required
   - All CI checks must pass
   - Squash and merge preferred

### Code Review Guidelines

#### For Reviewers
- Focus on correctness, performance, and maintainability
- Provide constructive feedback
- Suggest alternative approaches when appropriate
- Approve when code meets standards

#### For Authors
- Respond to all review comments
- Make requested changes or provide justification
- Keep PRs focused and reasonably sized
- Update based on feedback

This development guide provides the foundation for contributing to and extending the Azure AI Travel Agents system. Follow these guidelines to ensure consistent, high-quality code that integrates well with the existing architecture.