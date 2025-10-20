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
  srcDir: "src",
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
    nav: [
      {
        text: "Getting Started",
        link: "/getting-started",
      },
      {
        text: "Architecture",
        items: [
          {
            text: "Technical Architecture",
            link: "/technical-architecture",
          },
          { text: "Flow Diagrams", link: "/flow-diagrams" },
          {
            text: "Deployment Architecture",
            link: "/deployment-architecture",
          },
        ],
      },
      {
        text: "Implementation",
        items: [
          { text: "MCP Servers", link: "/mcp-servers" },
          { text: "Development Guide", link: "/development-guide" },
        ],
      },
      {
        text: "Orchestration",
        items: [
          { text: "Orchestration Overview", link: "/orchestration" },
          { text: "LlamaIndex.TS (Current)", link: "/technical-architecture#agent-orchestration" },
          { text: "MAF Implementation", link: "/maf-orchestration-design" },
        ],
      },
      {
        text: "AI Adventures",
        link: "/adventures/index.html",
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
            link: "/index",
          },
          {
            text: "Quick Start Guide",
            link: "/getting-started",
          },
          {
            text: "Advanced Setup",
            link: "/advanced-setup",
          },
          {
            text: "Package Naming Guide",
            link: "/package-naming-guide",
          },
        ],
      },
      {
        text: "Architecture",
        collapsed: false,
        items: [
          {
            text: "Overview",
            link: "/overview",
          },
          {
            text: "Technical Architecture",
            link: "/technical-architecture",
          },
          {
            text: "Flow Diagrams",
            link: "/flow-diagrams",
          },
          {
            text: "Deployment Architecture",
            link: "/deployment-architecture",
          },
        ],
      },
      {
        text: "Orchestration",
        collapsed: false,
        items: [
          {
            text: "Orchestration Overview",
            link: "/orchestration",
          },
          {
            text: "LlamaIndex.TS (Current)",
            link: "/technical-architecture#agent-orchestration",
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
            link: "/mcp-servers",
          },
          {
            text: "Development Guide",
            link: "/development-guide",
          },
        ],
      },
      {
        text: "MAF Documentation",
        collapsed: true,
        items: [
          {
            text: "MAF Overview",
            link: "/MAF-README",
          },
          {
            text: "Visual Guide",
            link: "/maf-visual-guide",
          },
          {
            text: "Orchestration Design",
            link: "/maf-orchestration-design",
          },
          {
            text: "Implementation Guide",
            link: "/maf-implementation-guide",
          },
          {
            text: "Comparison (MAF vs LlamaIndex)",
            link: "/maf-comparison",
          },
          {
            text: "Migration Plan",
            link: "/maf-migration-plan",
          },
          {
            text: "Quick Reference",
            link: "/maf-quick-reference",
          },
        ],
      },
      {
        text: "AI Adventures",
        link: "/adventures/index.html",
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
  rewrites: {
    'labs/index.html': 'labs/adventures/index.html',
  },
  ignoreDeadLinks: [
    // ignore all localhost links
    /^https?:\/\/localhost/,
  ],
})
