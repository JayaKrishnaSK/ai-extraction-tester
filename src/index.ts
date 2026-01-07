/**
 * Main Entry Point
 * Exports all public APIs
 */

// Core engines
export { Comparator } from './core/comparator';
export { Scorer } from './core/scorer';
export { DataFetcher } from './core/data-fetcher';
export { TestOrchestrator } from './core/orchestrator';
export { SchemaInferrer } from './core/schema-inference';

// Config
export { ConfigLoader } from './config/config-loader';

// Reporters
export { MarkdownReporter } from './reporters/markdown-reporter';
export { JsonReporter } from './reporters/json-reporter';

// Types
export type { TestSuiteConfig, TestCase, ComparisonRules, ScoringConfig } from './types';
export type {
  TestSuiteResult,
  TestCaseResult,
  ComparisonResult,
  ScoringResult,
} from './types';

// Utilities
export { createLogger } from './utils/logger';
