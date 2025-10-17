import { searchPlugin } from '@vuepress/plugin-search';
import { defineConfig } from 'vitepress';
import { mdEnhancePlugin } from 'vuepress-plugin-md-enhance';
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  base: "/azure-ai-travel-agents/",
  title: "Azure AI Travel Agents",
  description: "Documentation for Azure AI Travel Agents",
  lang: "en-US",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "ai-travel-agents-logo.png",
    head: [
      ["link", { rel: "icon", href: "ai-travel-agents-logo.png" }],
      ["meta", { name: "theme-color", content: "#0078d4" }],
      ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
      [
        "meta",
        { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      ],
    ],
    navbar: [
      {
        text: "Getting Started",
        link: "/",
      },
      {
        text: "Architecture",
        children: [
          {
            text: "Technical Architecture",
            link: "/technical-architecture.md",
          },
          { text: "Flow Diagrams", link: "/flow-diagrams.md" },
          {
            text: "Deployment Architecture",
            link: "/deployment-architecture.md",
          },
        ],
      },
      {
        text: "Implementation",
        children: [
          { text: "MCP Servers", link: "/mcp-servers.md" },
          { text: "Development Guide", link: "/development-guide.md" },
        ],
      },
      {
        text: "Orchestration",
        children: [
          { text: "Orchestration Overview", link: "/orchestration.md" },
          { text: "LlamaIndex.TS (Current)", link: "/technical-architecture.md#agent-orchestration" },
          { text: "MAF Implementation", link: "https://github.com/Azure-Samples/azure-ai-travel-agents/tree/main/src/api-python" },
        ],
      },
      {
        text: "Star Us",
        link: "https://github.com/Azure-Samples/azure-ai-travel-agents/stargazers",
      },
    ],

    sidebar: [
      {
        text: "Getting Started",
        collapsed: false,
        items: [
          {
            text: "Welcome",
            link: "/index.md",
          },
          {
            text: "Quick Start Guide",
            link: "/getting-started.md",
          },
          {
            text: "Advanced Setup",
            link: "/advanced-setup.md",
          },
          {
            text: "Package Naming Guide",
            link: "/package-naming-guide.md",
          },
        ],
      },
      {
        text: "Architecture",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/overview.md",
          },
          {
            text: "Technical Architecture",
            link: "/technical-architecture.md",
          },
          {
            text: "Flow Diagrams",
            link: "/flow-diagrams.md",
          },
          {
            text: "Deployment Architecture",
            link: "/deployment-architecture.md",
          },
        ],
      },
      {
        text: "Orchestration",
        collapsed: false,
        items: [
          {
            text: "Orchestration Overview",
            link: "/orchestration.md",
          },
          {
            text: "LlamaIndex.TS (Current)",
            link: "/technical-architecture.md#agent-orchestration",
          },
          {
            text: "MAF Implementation (Python)",
            link: "https://github.com/Azure-Samples/azure-ai-travel-agents/tree/main/src/api-python",
          },
        ],
      },
      {
        text: "Implementation",
        collapsed: false,
        items: [
          {
            text: "MCP Servers",
            link: "/mcp-servers.md",
          },
          {
            text: "Development Guide",
            link: "/development-guide.md",
          },
        ],
      },
      {
        text: "MAF Documentation",
        collapsed: true,
        items: [
          {
            text: "MAF Overview",
            link: "/MAF-README.md",
          },
          {
            text: "Visual Guide",
            link: "/maf-visual-guide.md",
          },
          {
            text: "Orchestration Design",
            link: "/maf-orchestration-design.md",
          },
          {
            text: "Implementation Guide",
            link: "/maf-implementation-guide.md",
          },
          {
            text: "Comparison (MAF vs LlamaIndex)",
            link: "/maf-comparison.md",
          },
          {
            text: "Migration Plan",
            link: "/maf-migration-plan.md",
          },
          {
            text: "Quick Reference",
            link: "/maf-quick-reference.md",
          },
        ],
      },
    ],

    editLinks: true,
    editLinkText: "Edit this page on GitHub",
    repo: "Azure-Samples/azure-ai-travel-agents",
    docsDir: "docs",
    docsBranch: "main",

    lastUpdated: {
      text: "Last Updated",
    },

    // Search configuration
    search: {
      provider: 'local', // Use local search index
    },
    searchMaxSuggestions: 10,
    plugins: [
      "@vuepress/plugin-back-to-top",
      "@vuepress/plugin-medium-zoom",
      mdEnhancePlugin({
        mermaid: true,
      }),
      searchPlugin({
        locales: {
          "/": {
            placeholder: "Search",
          },
        },
      }),
    ],
  },
  ignoreDeadLinks: [
    // ignore all localhost links
    /^https?:\/\/localhost/,
  ],
})
