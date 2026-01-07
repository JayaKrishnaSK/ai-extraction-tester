#!/usr/bin/env node

/**
 * CLI Runner
 * Command-line interface for running tests
 */

import path from 'path';
import fs from 'fs';
import { ConfigLoader } from '../config/config-loader';
import { TestOrchestrator } from '../core/orchestrator';
import { MarkdownReporter } from '../reporters/markdown-reporter';
import { JsonReporter } from '../reporters/json-reporter';
import { createLogger } from '../utils/logger';

const logger = createLogger('CLI');

interface CLIOptions {
  config: string;
  report?: string;
  output?: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = { config: '' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      options.config = args[++i];
    } else if (args[i] === '--report' && args[i + 1]) {
      options.report = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[++i];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  if (!options.config) {
    console.error('Usage: node runner.ts --config <path> [--report <format>] [--output <path>]');
    console.error('Formats: md, json (comma-separated)');
    process.exit(1);
  }

  try {
    logger.info('🚀 Starting AI Extraction Tester');

    // Load config
    const configLoader = new ConfigLoader();
    const config = configLoader.loadFromFile(options.config);
    logger.info(`Loaded config: ${config.suite.name}`);

    // Run tests
    const orchestrator = new TestOrchestrator();
    const result = await orchestrator.runSuite(config);

    // Generate reports
    const formats = (options.report || 'md').split(',').map((f) => f.trim());

    for (const format of formats) {
      let report: string;
      let extension: string;

      if (format === 'md') {
        const mdReporter = new MarkdownReporter();
        report = mdReporter.generate(result);
        extension = '.md';
      } else if (format === 'json') {
        const jsonReporter = new JsonReporter();
        report = jsonReporter.generate(result);
        extension = '.json';
      } else {
        logger.warn(`Unknown report format: ${format}`);
        continue;
      }

      // Determine output path
      let outputPath: string;
      if (options.output) {
        outputPath = options.output.endsWith(extension)
          ? options.output
          : options.output + extension;
      } else {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const configName = path.parse(options.config).name;
        outputPath = `${configName}-${timestamp}${extension}`;
      }

      fs.writeFileSync(outputPath, report);
      logger.info(`Report saved: ${outputPath}`);
    }

    logger.info('✅ Tests completed successfully');
  } catch (error) {
    logger.error('Test execution failed', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unexpected error', error);
  process.exit(1);
});
