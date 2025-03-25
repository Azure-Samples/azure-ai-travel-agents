import { agent, tool, multiAgent, openai } from "llamaindex";
import { z } from "zod";

import dotenv from "dotenv";
dotenv.config();

const llm = async () => {
  return openai({
    azure: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    },
  });
};

export default async function main() {

  // Define a joke-telling tool
  const jokeTool = tool(() => "Baby Llama is called cria", {
    name: "joke",
    description: "Use this tool to get a joke",
  });

  // Create a weather agent
  const weatherAgent = agent({
    name: "WeatherAgent",
    description: "Provides weather information for any city",
    tools: [
      tool({
        name: "fetchWeather",
        description: "Get weather information for a city",
        parameters: z.object({
          city: z.string(),
        }),
        execute: ({ city }) => `The weather in ${city} is sunny`,
      }),
    ],
    llm: await llm(),
  });

  // Create a joke-telling agent
  const jokeAgent = agent({
    name: "JokeAgent",
    description: "Tells jokes and funny stories",
    tools: [jokeTool], // Using the joke tool defined earlier
    llm: await llm(),
    canHandoffTo: [weatherAgent], // Can hand off to the weather agent
  });

  // Create the multi-agent workflow
  const agents = multiAgent({
    agents: [jokeAgent, weatherAgent],
    rootAgent: jokeAgent, // Start with the joke agent
  });

  // Run the workflow
  const context = jokeAgent.run(
    "Tell me something funny about the weather. Use weatherAgent to get the weather information."
  );
  // Stream and handle events
  for await (const event of context) {
    // format as: displayName: "JokeAgent", message: "Tell me something funny", Agent: "JokeAgent"
    const { displayName, data } = event;
    console.log(
      `[${(data as any).currentAgentName}] [${displayName}]\t${
        (data as any).delta
      }`
    );
  }
}