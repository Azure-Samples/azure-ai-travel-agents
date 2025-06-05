module.exports = {
  title: 'Azure AI Travel Agents',
  description: 'Technical Documentation for Azure AI Travel Agents - Intelligent Travel Planning System',
  
  head: [
    ['link', { rel: 'icon', href: '/ai-travel-agents-logo.png' }],
    ['meta', { name: 'theme-color', content: '#0078d4' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  // Base URL for GitHub Pages
  base: '/azure-ai-travel-agents/',

  themeConfig: {
    logo: '/ai-travel-agents-logo.png',
    
    nav: [
      {
        text: 'Home',
        link: '/',
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Technical Architecture', link: '/technical-architecture.md' },
          { text: 'Flow Diagrams', link: '/flow-diagrams.md' },
          { text: 'Deployment Architecture', link: '/deployment-architecture.md' },
        ],
      },
      {
        text: 'Implementation',
        items: [
          { text: 'MCP Servers', link: '/mcp-servers.md' },
          { text: 'API Documentation', link: '/api-documentation.md' },
          { text: 'Development Guide', link: '/development-guide.md' },
        ],
      },
      {
        text: 'GitHub',
        link: 'https://github.com/Azure-Samples/azure-ai-travel-agents',
      },
    ],

    sidebar: [
      {
        title: 'Overview',
        collapsable: false,
        children: [
          '/',
        ],
      },
      {
        title: 'Architecture & Design',
        collapsable: false,
        children: [
          '/technical-architecture.md',
          '/flow-diagrams.md',
        ],
      },
      {
        title: 'Implementation Guides',
        collapsable: false,
        children: [
          '/mcp-servers.md',
          '/api-documentation.md',
          '/development-guide.md',
        ],
      },
      {
        title: 'Operations & Deployment',
        collapsable: false,
        children: [
          '/deployment-architecture.md',
        ],
      },
    ],

    editLinks: true,
    editLinkText: 'Edit this page on GitHub',
    repo: 'Azure-Samples/azure-ai-travel-agents',
    docsDir: 'docs',
    docsBranch: 'main',

    lastUpdated: 'Last Updated',

    // Search configuration
    search: true,
    searchMaxSuggestions: 10,
  },

  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ],
}