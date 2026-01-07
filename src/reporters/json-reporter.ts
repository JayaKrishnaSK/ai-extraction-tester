/**
 * JSON Report Generator
 * Machine-readable test reports for CI/analytics
 */

import { TestSuiteResult } from '../types';

export class JsonReporter {
  generate(result: TestSuiteResult): string {
    return JSON.stringify(result, null, 2);
  }

  generateCompact(result: TestSuiteResult): string {
    return JSON.stringify(result);
  }
}
