/**
 * A2A Protocol Integration Tests
 * 
 * Basic tests to validate A2A implementation
 */

import { A2AServer, A2AClient, A2ATravelAgent, TravelAgentFactory } from "./index.js";

// Mock LlamaIndex agent for testing
class MockAgent {
  constructor(public name: string) {}
  
  async chat(options: any) {
    return {
      message: {
        content: `Mock response from ${this.name}: ${options.message}`
      }
    };
  }
}

// Simple integration test without Jest
export async function runBasicA2ATest() {
  console.log('Running basic A2A integration test...');
  
  try {
    // Create mock agent
    const mockAgent = new MockAgent('TestAgent');
    
    // Create A2A agent
    const testAgent = new A2ATravelAgent(
      'test-agent',
      'Test Agent',
      'A test agent for validation',
      [{
        type: 'text',
        name: 'test',
        description: 'Test capability',
        inputSchema: { type: 'object', properties: { message: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { result: { type: 'string' } } }
      }],
      mockAgent
    );
    
    // Test agent initialization
    await testAgent.initialize();
    console.log('✓ Agent initialized successfully');
    
    // Test agent execution
    const result = await testAgent.execute('test', { message: 'Hello' });
    console.log('✓ Agent execution successful:', result);
    
    // Test agent status
    const status = await testAgent.getStatus();
    console.log('✓ Agent status:', status);
    
    // Test agent card
    const card = testAgent.getCard();
    console.log('✓ Agent card:', card.name, 'with', card.capabilities.length, 'capabilities');
    
    await testAgent.shutdown();
    console.log('✓ Agent shutdown successful');
    
    console.log('✓ Basic A2A integration test passed!');
    return true;
  } catch (error) {
    console.error('✗ Basic A2A integration test failed:', error);
    return false;
  }
}

export async function runA2AServerClientTest() {
  console.log('Running A2A server-client integration test...');
  
  let server: A2AServer | undefined;
  
  try {
    // Create mock agents
    const mockTriageAgent = new MockAgent('TriageAgent');
    const mockCustomerAgent = new MockAgent('CustomerQueryAgent');
    
    // Create A2A agents
    const triageAgent = TravelAgentFactory.createTriageAgent(mockTriageAgent, 'http://localhost:3002');
    const customerAgent = TravelAgentFactory.createCustomerQueryAgent(mockCustomerAgent, 'http://localhost:3002');
    
    // Setup A2A server
    server = new A2AServer({
      port: 3002,
      host: 'localhost',
      agents: [triageAgent, customerAgent],
      cors: { enabled: true },
      logging: { enabled: false, level: 'error' }
    });
    
    await server.start();
    console.log('✓ A2A server started');
    
    // Setup A2A client
    const client = new A2AClient({
      baseUrl: 'http://localhost:3002'
    });
    
    // Test agent discovery
    const agents = await client.discover();
    console.log('✓ Agent discovery successful, found', agents.length, 'agents');
    
    if (agents.length !== 2) {
      throw new Error(`Expected 2 agents, found ${agents.length}`);
    }
    
    // Test agent execution
    const result = await client.execute(
      'triage-agent',
      'triage',
      { query: 'Plan a trip to Tokyo' }
    );
    console.log('✓ Agent execution successful:', result.message);
    
    // Test agent status
    const status = await client.getStatus('triage-agent');
    console.log('✓ Agent status check:', status.status);
    
    if (status.status !== 'active') {
      throw new Error(`Expected agent status to be 'active', got '${status.status}'`);
    }
    
    await server.stop();
    server = undefined;
    console.log('✓ A2A server stopped');
    
    console.log('✓ A2A server-client integration test passed!');
    return true;
  } catch (error) {
    console.error('✗ A2A server-client integration test failed:', error);
    
    if (server) {
      try {
        await server.stop();
      } catch (e) {
        console.error('Error stopping server:', e);
      }
    }
    
    return false;
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const test1 = await runBasicA2ATest();
    console.log('');
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const test2 = await runA2AServerClientTest();
    
    const success = test1 && test2;
    console.log('');
    console.log(success ? '✓ All A2A tests passed!' : '✗ Some A2A tests failed!');
    process.exit(success ? 0 : 1);
  })();
}