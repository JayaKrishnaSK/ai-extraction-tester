# 🧪 AI Extraction Tester

**Automated API-triggerable testing framework for AI extraction services**

A contract + regression testing system that compares dynamic JSON outputs of extraction services against ground truth data with schema inference, field-level comparison, and comprehensive scoring.

[![GitHub](https://img.shields.io/badge/GitHub-ai--extraction--tester-blue)](https://github.com/JayaKrishnaSK/ai-extraction-tester)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Features

✅ **Schema-Agnostic Comparison** - Infers structure from ground truth, no hardcoded schemas  
✅ **Multiple Scoring Dimensions** - Completeness, Accuracy, Extra Fields penalty  
✅ **Dynamic JSON Diffing** - Nested objects, arrays, type coercion, numeric tolerance  
✅ **Flexible Comparison Rules** - Field exclusions, array ordering, type strictness  
✅ **Multi-Format Reports** - Markdown (human) + JSON (CI/automation)  
✅ **API-Triggered Execution** - HTTP endpoints for integration  
✅ **CLI + Programmatic** - Command-line and library usage  
✅ **Concurrent Test Execution** - Configurable parallelism + rate limiting  
✅ **Comprehensive Auth** - Bearer tokens, API keys, no-auth modes  
✅ **Extensible Architecture** - Custom reporters, scoring, data sources  

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/JayaKrishnaSK/ai-extraction-tester.git
cd ai-extraction-tester
npm install
npm run build
```

### Create a Test Config

```yaml
# tests/invoice.yaml
version: "1.0.0"
suite:
  name: "Invoice Extraction"
  serviceVersion: "v1.0"

auth:
  type: "bearer"
  tokenEnv: "API_TOKEN"

defaults:
  comparison:
    ignoreFields: ["meta.timestamp"]
    arrayStrategy: "unordered"
    numericTolerance: 0.01

cases:
  - id: "invoice-001"
    input:
      type: "file"
      path: "./samples/invoice1.pdf"
    groundTruth:
      type: "json"
      source: "./ground-truth/invoice1.json"
    execution:
      type: "api"
      endpoint: "https://api.example.com/extract"
      method: "POST"
```

### Run Tests

#### CLI
```bash
npm run cli -- --config tests/invoice.yaml --report md,json
```

#### API Server
```bash
npm run api
# POST http://localhost:3000/run-suite with config
```

#### Programmatic
```typescript
import { ConfigLoader, TestOrchestrator, MarkdownReporter } from 'ai-extraction-tester';

const config = new ConfigLoader().loadFromFile('tests/invoice.yaml');
const result = await new TestOrchestrator().runSuite(config);
console.log(new MarkdownReporter().generate(result));
```

## 📚 Documentation

- **[Usage Guide](./USAGE.md)** - For developers using the tester
- **[Maintenance Guide](./MAINTENANCE.md)** - For maintaining and extending the codebase
- **[Example Configs](./examples/)** - Real-world test configurations

## 🏗 Architecture

### Core Components

```
ConfigLoader
    ↓ (validates YAML/JSON)
TestOrchestrator
    ├── DataFetcher (loads input, GT, executes service)
    ├── Comparator (deep JSON diffing with schema inference)
    ├── Scorer (calculates accuracy, completeness, extra fields)
    └── Reporters (Markdown + JSON)
```

### Key Design Decisions

1. **Schema-Agnostic** - Schema inferred from ground truth, not predefined
2. **Penalty-Based Scoring** - Multiple dimensions (completeness, accuracy, extra fields)
3. **Declarative Config** - YAML/JSON, version-controlled, reproducible
4. **Concurrent Execution** - Parallel test cases with rate limiting
5. **Extensible** - Custom reporters, scorers, data sources

## 📊 Comparison Results

Each test case generates:

### Comparison Output
- **Mismatches** - Field value/type differences
- **Missing** - Fields in ground truth but not in output
- **Extra** - Fields in output but not in ground truth
- **Warnings** - Array order differences, type coercions

### Scoring Output

| Score | Range | Meaning |
|-------|-------|----------|
| Overall Score | 0-100 | Weighted penalty-based (100 - penalties) |
| Completeness | 0-100 | % of fields present |
| Accuracy | 0-100 | % of fields correctly matched |
| Extra Field Score | 0-100 | Penalty for extra fields |

### Example Report

```markdown
## Case: invoice-001
Status: ✅ PASSED
Overall Score: 95.2/100
Completeness: 100%
Accuracy: 95%

### Field Breakdown
- Total Fields: 15
- Matched: 14 ✅
- Missing: 0
- Mismatched: 1 ⚠️
- Extra: 1 🔍
```

## 🔧 Configuration

### Comparison Rules

```yaml
defaults:
  comparison:
    ignoreFields:      # Fields to skip in comparison
    arrayStrategy:     # "ordered" or "unordered"
    numericTolerance:  # Floating-point tolerance
    typeCoercion:      # Allow "100" === 100
    extraFieldsWarning: true
```

### Scoring Configuration

```yaml
defaults:
  scoring:
    missingFieldPenalty: 10    # Per missing field
    mismatchPenalty: 5         # Per mismatched field
    extraFieldPenalty: 2       # Per extra field
```

### Authentication

```yaml
auth:
  type: "bearer"            # or "api-key" or "none"
  tokenEnv: "API_TOKEN"     # Environment variable
  # OR
  # type: "api-key"
  # keyEnv: "API_KEY"
  # headerName: "X-API-Key"
```

## 🧩 Data Sources

### File
```yaml
input:
  type: "file"
  path: "./samples/invoice.pdf"
```

### API
```yaml
groundTruth:
  type: "api"
  endpoint: "https://gt-service.com/case/001"
  method: "GET"
```

### Inline JSON
```yaml
groundTruth:
  type: "json"
  source:
    invoiceNumber: "INV-001"
    amount: 1000
```

## 📦 API Endpoints

### POST /run-suite
Run test suite from configuration

**Request**:
```json
{
  "config": { /* test suite config */ },
  "format": "json"  // or "markdown"
}
```

**Response**: Test results

### POST /validate-config
Validate configuration without running tests

**Request**:
```json
{
  "config": { /* test suite config */ }
}
```

**Response**: Validation result

### GET /health
Health check endpoint

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Extraction Tests
  env:
    EXTRACTION_API_TOKEN: ${{ secrets.API_TOKEN }}
  run: |
    npm run cli -- \
      --config tests/invoice.yaml \
      --report json \
      --output results.json

- name: Check Results
  run: |
    PASS_RATE=$(cat results.json | jq '.passedCases / .totalCases * 100')
    if (( $(echo "$PASS_RATE < 90" | bc -l) )); then
      exit 1
    fi
```

## 💻 Development

### Scripts

```bash
npm run build          # Build TypeScript
npm run dev            # Development mode
npm run test           # Run tests
npm run cli            # Run CLI
npm run api            # Start API server
npm run lint           # Lint code
npm run format         # Format code
```

### Project Structure

```
src/
├── types/              # Type definitions
├── core/              # Core engines
├── config/            # Configuration loading
├── reporters/         # Report generators
├── api/               # Express server
├── cli/               # CLI runner
├── utils/             # Utilities
└── index.ts           # Public API
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙋 Support

- 📖 [Documentation](./USAGE.md)
- 🐛 [Issue Tracker](https://github.com/JayaKrishnaSK/ai-extraction-tester/issues)
- 💬 [Discussions](https://github.com/JayaKrishnaSK/ai-extraction-tester/discussions)

## 🎓 Learning Resources

- [Configuration Reference](./USAGE.md#-configuration-guide)
- [Architecture Overview](./MAINTENANCE.md#-architecture-overview)
- [Example Configurations](./examples/)
- [Troubleshooting Guide](./USAGE.md#-troubleshooting)

---

**Built for AI teams who need reliable extraction quality benchmarking** 🚀

*Made with ❤️ by the AI Extraction Tester team*
