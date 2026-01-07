import { z } from 'zod';

// Auth schema
const AuthSchemaBase = z.object({
  type: z.enum(['bearer', 'api-key', 'none']),
});

const BearerAuthSchema = AuthSchemaBase.extend({
  type: z.literal('bearer'),
  tokenEnv: z.string(),
});

const ApiKeyAuthSchema = AuthSchemaBase.extend({
  type: z.literal('api-key'),
  keyEnv: z.string(),
  headerName: z.string().default('X-API-Key'),
});

const NoAuthSchema = AuthSchemaBase.extend({
  type: z.literal('none'),
});

export const AuthSchema = z.union([BearerAuthSchema, ApiKeyAuthSchema, NoAuthSchema]);
export type Auth = z.infer<typeof AuthSchema>;

// Data source schemas
const FileSourceSchema = z.object({
  type: z.literal('file'),
  path: z.string(),
});

const ApiSourceSchema = z.object({
  type: z.literal('api'),
  endpoint: z.string().url(),
  method: z.enum(['GET', 'POST']).default('POST'),
  body: z.record(z.any()).optional(),
});

const JsonSourceSchema = z.object({
  type: z.literal('json'),
  source: z.union([z.string(), z.record(z.any())]), // file path or inline JSON
});

export const DataSourceSchema = z.union([FileSourceSchema, ApiSourceSchema, JsonSourceSchema]);
export type DataSource = z.infer<typeof DataSourceSchema>;

// Comparison rules
export const ComparisonRulesSchema = z.object({
  ignoreFields: z.array(z.string()).optional().default([]),
  arrayStrategy: z.enum(['ordered', 'unordered']).default('unordered'),
  numericTolerance: z.number().min(0).default(0),
  typeCoercion: z.boolean().default(true),
  extraFieldsWarning: z.boolean().default(true),
});
export type ComparisonRules = z.infer<typeof ComparisonRulesSchema>;

// Scoring configuration
export const ScoringConfigSchema = z.object({
  weights: z.record(z.number()).optional().default({}),
  missingFieldPenalty: z.number().min(0).max(100).default(10),
  mismatchPenalty: z.number().min(0).max(100).default(5),
  extraFieldPenalty: z.number().min(0).max(100).default(2),
});
export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;

// Test case configuration
export const TestCaseSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  input: DataSourceSchema,
  groundTruth: DataSourceSchema,
  execution: z.object({
    type: z.enum(['api', 'function']),
    endpoint: z.string().url().optional(),
    method: z.enum(['GET', 'POST']).default('POST').optional(),
    functionName: z.string().optional(),
  }),
  comparison: ComparisonRulesSchema.partial().optional(),
  scoring: ScoringConfigSchema.partial().optional(),
});
export type TestCase = z.infer<typeof TestCaseSchema>;

// Test suite configuration (root config)
export const TestSuiteConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  suite: z.object({
    name: z.string(),
    description: z.string().optional(),
    serviceVersion: z.string().optional(),
  }),
  defaults: z.object({
    comparison: ComparisonRulesSchema.partial().optional(),
    scoring: ScoringConfigSchema.partial().optional(),
  }).optional(),
  auth: AuthSchema.optional(),
  concurrency: z.object({
    maxParallel: z.number().min(1).default(3),
    delayBetweenRequests: z.number().min(0).default(100),
  }).optional(),
  cases: z.array(TestCaseSchema),
});

export type TestSuiteConfig = z.infer<typeof TestSuiteConfigSchema>;
