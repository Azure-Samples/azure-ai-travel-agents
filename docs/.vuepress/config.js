import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { defaultTheme } from "@vuepress/theme-default";
import { mdEnhancePlugin } from "vuepress-plugin-md-enhance";
import { searchPlugin } from "@vuepress/plugin-search";

export default defineUserConfig({
  preprocessorOptions: {
    sass: {
      api: "modern-compiler",
    },
  },
  base: "/azure-ai-travel-agents/",
  title: "Azure AI Travel Agents",
  description: "Documentation for Azure AI Travel Agents",
  lang: "en-US",

  bundler: viteBundler({
    // vite bundler options here
  }),
  theme: defaultTheme({
    logo: "/ai-travel-agents-logo.png",
    head: [
      ["link", { rel: "icon", href: "/ai-travel-agents-logo.png" }],
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
          { text: "API Documentation", link: "/api-documentation.md" },
          { text: "Development Guide", link: "/development-guide.md" },
        ],
      },
      {
        text: "Star Us",
        link: "https://github.com/Azure-Samples/azure-ai-travel-agents/stargazers",
      },
    ],

    sidebar: [
      {
        title: "Getting Started",
        collapsable: false,
        children: ["/", "/advanced-setup.md"],
      },
      {
        title: "Overview",
        collapsable: false,
        children: ["/overview.md"],
      },
      {
        title: "Architecture & Design",
        collapsable: false,
        children: ["/technical-architecture.md", "/flow-diagrams.md"],
      },
      {
        title: "Implementation Guides",
        collapsable: false,
        children: [
          "/mcp-servers.md",
          "/api-documentation.md",
          "/development-guide.md",
        ],
      },
      {
        title: "Operations & Deployment",
        collapsable: false,
        children: ["/deployment-architecture.md"],
      },
    ],

    editLinks: true,
    editLinkText: "Edit this page on GitHub",
    repo: "Azure-Samples/azure-ai-travel-agents",
    docsDir: "docs",
    docsBranch: "main",

    lastUpdated: "Last Updated",

    // Search configuration
    search: true,
    searchMaxSuggestions: 10,
  }),

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
});
