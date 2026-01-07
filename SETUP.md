# AI Extraction Tester - Setup Guide

## Project Overview

This is a complete Node.js project for testing AI extraction services. The project has been set up with:

✅ Full TypeScript setup with strict mode  
✅ Core comparison, scoring, and orchestration engines  
✅ CLI and HTTP API interfaces  
✅ Multiple report formats (Markdown, JSON)  
✅ Comprehensive documentation  
✅ Example configurations  

## Quick Setup

### 1. Install Dependencies

```bash
cd ai-extraction-tester
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Set Environment Variables

```bash
export EXTRACTION_API_TOKEN="your-api-token-here"
export LOG_LEVEL="info"  # or "debug" for verbose logging
```

### 4. Run Tests (CLI)

```bash
# Using the example config
npm run cli -- --config examples/invoice-extraction.yaml --report md,json
```

### 5. Start API Server (Optional)

```bash
npm run api
# Server starts on http://localhost:3000
```

## Project Structure

```
ai-extraction-tester/
├── src/
│   ├── types/                  # TypeScript type definitions
│   │   ├── config.ts          # Zod schemas for configuration
│   │   └── results.ts         # Result data types
│   ├── core/                  # Core engines
│   │   ├── schema-inference.ts    # Extract schema from GT
│   │   ├── comparator.ts          # Deep JSON diffing
│   │   ├── scorer.ts              # Calculate metrics
│   │   ├── data-fetcher.ts        # Load data from sources
│   │   └── orchestrator.ts        # Coordinate execution
│   ├── config/
│   │   └── config-loader.ts   # Load and validate configs
│   ├── reporters/
│   │   ├── markdown-reporter.ts
│   │   └── json-reporter.ts
│   ├── api/
│   │   └── server.ts          # Express HTTP API
│   ├── cli/
│   │   └── runner.ts          # CLI entry point
│   ├── utils/
│   │   └── logger.ts          # Logging utility
│   └── index.ts               # Public API exports
├── examples/
│   └── invoice-extraction.yaml    # Example configuration
├── tests/                      # Jest test directory
├── dist/                       # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── jest.config.js
├── README.md
├── USAGE.md                   # For developers using the service
├── MAINTENANCE.md             # For maintaining the codebase
└── .gitignore
```

## Available Scripts

```bash
npm run build          # Compile TypeScript to JavaScript
npm run dev            # Watch mode (auto-rebuild)
npm run start          # Run compiled project
npm run cli            # Run CLI (requires --config)
npm run api            # Start HTTP API server
npm run test           # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run lint           # Check code style
npm run format         # Format code with Prettier
npm run clean          # Remove dist directory
```

## CLI Usage Examples

### Run with default markdown output
```bash
npm run cli -- --config examples/invoice-extraction.yaml
```

### Generate JSON report
```bash
npm run cli -- \
  --config examples/invoice-extraction.yaml \
  --report json \
  --output invoice-results.json
```

### Generate both Markdown and JSON
```bash
npm run cli -- \
  --config examples/invoice-extraction.yaml \
  --report md,json
```

## API Usage Examples

### Start the server
```bash
PORT=3001 npm run api
```

### Run tests via HTTP
```bash
curl -X POST http://localhost:3000/run-suite \
  -H "Content-Type: application/json" \
  -d @config.json
```

### Validate configuration
```bash
curl -X POST http://localhost:3000/validate-config \
  -H "Content-Type: application/json" \
  -d @config.json
```

### Health check
```bash
curl http://localhost:3000/health
```

## Programmatic Usage

```typescript
import {
  ConfigLoader,
  TestOrchestrator,
  MarkdownReporter,
  JsonReporter,
} from './dist/index.js';

async function main() {
  // Load configuration
  const configLoader = new ConfigLoader();
  const config = configLoader.loadFromFile('examples/invoice-extraction.yaml');

  // Run tests
  const orchestrator = new TestOrchestrator();
  const result = await orchestrator.runSuite(config);

  // Generate reports
  const mdReporter = new MarkdownReporter();
  console.log(mdReporter.generate(result));

  const jsonReporter = new JsonReporter();
  console.log(jsonReporter.generate(result));
}

main().catch(console.error);
```

## Configuration Basics

### Minimal Configuration

```yaml
version: "1.0.0"
suite:
  name: "My Test Suite"

cases:
  - id: "test-001"
    input:
      type: "json"
      source: { content: "test" }
    groundTruth:
      type: "json"
      source: { content: "test" }
    execution:
      type: "api"
      endpoint: "http://localhost:8000/extract"
      method: "POST"
```

### Full Configuration with All Options

See `examples/invoice-extraction.yaml` for a comprehensive example.

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
npm run clean
npm run build
```

### Dependencies Missing

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Port Already in Use

```bash
PORT=3001 npm run api  # Use different port
```

### Debugging

Enable debug logging:
```bash
LOG_LEVEL=debug npm run cli -- --config examples/invoice-extraction.yaml
```

## Next Steps

1. **Read the Usage Guide**: See [USAGE.md](./USAGE.md) for detailed instructions
2. **Review Examples**: Check [examples/](./examples/) for real-world configs
3. **Understand Architecture**: See [MAINTENANCE.md](./MAINTENANCE.md) for design details
4. **Create Your Config**: Build a test suite for your extraction service
5. **Integrate with CI/CD**: Add to your GitHub Actions or pipeline

## Key Features

🔍 **Schema Inference** - Automatically infers structure from ground truth  
📊 **Multi-Dimensional Scoring** - Completeness, accuracy, extra fields  
📝 **Flexible Comparison** - Field exclusions, array ordering, type coercion  
🚀 **Concurrent Execution** - Parallel test cases with rate limiting  
🔐 **Multiple Auth** - Bearer tokens, API keys, no-auth  
📋 **Multiple Outputs** - Markdown for humans, JSON for machines  

## Support & Documentation

- 📖 **[USAGE.md](./USAGE.md)** - Complete usage guide
- 🔧 **[MAINTENANCE.md](./MAINTENANCE.md)** - Architecture & development
- 📝 **[README.md](./README.md)** - Project overview
- 💡 **[examples/](./examples/)** - Example configurations

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js (API)
- **Validation**: Zod
- **Testing**: Jest
- **CLI**: Native Node.js
- **Config**: YAML + JSON

---

**Ready to test your extraction service?** Start with `npm run cli -- --config examples/invoice-extraction.yaml`

**Need help?** Check the [Usage Guide](./USAGE.md) or [Troubleshooting](./MAINTENANCE.md#-common-issues) section.
