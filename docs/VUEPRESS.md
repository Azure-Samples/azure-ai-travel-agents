---
title: VUEPRESS
createTime: 2025/06/06 13:07:02
permalink: /article/r74qb60p/
---
# VuePress Documentation Site

This directory contains the VuePress-based documentation website for Azure AI Travel Agents.

## Development

### Prerequisites

- Node.js 18+ 
- npm

### Setup

```bash
# Navigate to docs directory
cd docs

# Install dependencies
npm install

# Start development server
npm run docs:dev
```

The development server will be available at `http://localhost:8080`.

### Building for Production

```bash
# Navigate to docs directory
cd docs

# Build static files
npm run docs:build
```

The built files will be generated in `.vuepress/dist/`.

### Deployment

The documentation is automatically deployed to GitHub Pages using GitHub Actions when changes are pushed to the `main` branch.

#### Manual Deployment

To manually deploy to the `docs` branch:

```bash
# Navigate to docs directory
cd docs

npm run docs:deploy
```

## Configuration

The VuePress configuration is located at `.vuepress/config.js`.

### Key Features

- **Navigation**: Organized by Architecture, Implementation, and Operations
- **Search**: Built-in search functionality
- **Responsive Design**: Mobile-friendly layout
- **GitHub Integration**: Edit links and repository references
- **Asset Optimization**: Automatic image and asset optimization

## Structure

```
docs/
├── .vuepress/
│   ├── config.js           # VuePress configuration
│   ├── public/            # Static assets (images, icons)
│   └── dist/              # Built documentation (generated)
├── package.json           # Dependencies and scripts
├── scripts/
│   └── deploy-docs.sh     # Manual deployment script
├── VUEPRESS.md           # This documentation
├── README.md             # Homepage
├── technical-architecture.md
├── flow-diagrams.md
├── mcp-servers.md
├── api-documentation.md
├── development-guide.md
└── deployment-architecture.md
```

## Adding Content

1. Create or edit Markdown files in the `docs/` directory
2. Update the sidebar configuration in `.vuepress/config.js` if adding new pages
3. Place any images in `.vuepress/public/` 
4. Reference images in Markdown using `/image-name.png` (relative to public folder)

## Theme Customization

The site uses the default VuePress theme with custom configuration:

- **Logo**: Azure AI Travel Agents logo
- **Colors**: Azure blue theme (`#0078d4`)
- **Navigation**: Multi-level navigation with dropdowns
- **Sidebar**: Hierarchical documentation structure

## Troubleshooting

### Build Issues

If you encounter build issues:

1. Clear the cache: `rm -rf node_modules && npm install`
2. Clear VuePress cache: `rm -rf .vuepress/.cache`
3. Rebuild: `npm run docs:build`

### Development Server Issues

If the development server doesn't start:

1. Check that port 8080 is available
2. Try using a different port: `vuepress dev . --port 3000`

## Contributing

When contributing to the documentation:

1. Follow the existing Markdown style and structure
2. Include descriptive headings and proper formatting
3. Add code examples where appropriate
4. Update the navigation if adding new sections
5. Test locally before committing changes