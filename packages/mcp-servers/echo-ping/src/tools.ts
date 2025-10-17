import { log, tracer, meter } from "./instrumentation.js";

export const EchoTools = [
  {
    name: "echo",
    description:
      "Echo back the input values. Useful for testing and debugging.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
      },
      required: ["text"],
    },
    outputSchema: {
      type: "object",
      properties: {
        content: {
          type: "array",
          items: {
            type: "object",
            properties: { type: { type: "string" }, text: { type: "string" } },
          },
        },
      },
    },
    async execute({ text }: { text: string }) {
      return tracer.startActiveSpan("echo", async (span) => {
        log("Received request to echo:", { text });
        span.addEvent("echo");
        span.end();
        return await Promise.resolve({
          content: [
            {
              type: "text" as const,
              text: `Echoed text: ${text} - from the server at ${new Date().toISOString()}`,
            },
          ],
        });
      });
    },
  },
];
