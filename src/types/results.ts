export interface FieldMismatch {
  path: string;
  groundTruth: any;
  actual: any;
  type: 'value' | 'type' | 'numeric';
  warning?: string;
}

export interface ArrayOrderWarning {
  path: string;
  message: string;
}

export interface ExtraField {
  path: string;
  value: any;
}

export interface MissingField {
  path: string;
  expectedValue: any;
}

export interface ComparisonResult {
  passed: boolean;
  mismatches: FieldMismatch[];
  missing: MissingField[];
  extra: ExtraField[];
  warnings: ArrayOrderWarning[];
}

export interface FieldScore {
  field: string;
  score: number; // 0-100
  penalty: number;
  reason?: string;
}

export interface ScoringResult {
  overallScore: number; // 0-100
  completenessScore: number; // 0-100 (% of fields present)
  accuracyScore: number; // 0-100 (% of fields correctly matched)
  extraFieldScore: number; // penalty for extra fields
  fieldScores: FieldScore[];
  breakdown: {
    totalFields: number;
    matchedFields: number;
    missingFields: number;
    mismatchedFields: number;
    extraFields: number;
  };
}

export interface TestCaseResult {
  caseId: string;
  description?: string;
  status: 'passed' | 'failed' | 'warning';
  executedAt: Date;
  comparison: ComparisonResult;
  scoring: ScoringResult;
  executionTime: number; // ms
  error?: {
    message: string;
    code: string;
  };
}

export interface TestSuiteResult {
  suiteId: string;
  suiteName: string;
  version: string;
  serviceVersion?: string;
  executedAt: Date;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  warningCases: number;
  cases: TestCaseResult[];
  aggregatedScoring: {
    averageScore: number;
    averageCompleteness: number;
    averageAccuracy: number;
  };
  totalExecutionTime: number; // ms
}
