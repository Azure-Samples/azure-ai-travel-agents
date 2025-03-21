import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { z } from 'zod';

const client = new Client(
  { name: 'client-name', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(
  new SSEClientTransport(new URL('http://localhost:5000/sse'))
);

// Execute the 'echo' tool with progress tracking
const result: any = await client.callTool(
  {
    name: 'echo',
    arguments: {
      name: 'Hello World',
    },
  },
  undefined, // responseSchema is optional, or you can define a Zod schema here
  {
    onprogress: (progress) => {
      console.log(
        `Progress: ${progress.progress}/${progress.total}`
      );
    },
  },
);

console.log(result.content[0].text); // Output: Hello MCP User! I'm Test User from Test Org.
