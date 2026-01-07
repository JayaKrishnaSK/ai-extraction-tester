/**
 * Markdown Report Generator
 * Human-readable test reports
 */

import { TestSuiteResult, TestCaseResult } from '../types';

export class MarkdownReporter {
  generate(result: TestSuiteResult): string {
    let md = '';

    // Header
    md += `# Test Suite Report: ${result.suiteName}\n\n`;
    md += `**Generated**: ${result.executedAt.toISOString()}\n`;
    md += `**Config Version**: ${result.version}\n`;
    if (result.serviceVersion) {
      md += `**Service Version**: ${result.serviceVersion}\n`;
    }
    md += `\n---\n\n`;

    // Summary
    md += this.generateSummary(result);
    md += `\n---\n\n`;

    // Aggregated Scores
    md += this.generateAggregatedScores(result);
    md += `\n---\n\n`;

    // Individual Cases
    md += `## Test Cases\n\n`;
    for (const testCase of result.cases) {
      md += this.generateCaseReport(testCase);
      md += `\n`;
    }

    return md;
  }

  private generateSummary(result: TestSuiteResult): string {
    let md = `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Cases | ${result.totalCases} |\n`;
    md += `| Passed | ✅ ${result.passedCases} |\n`;
    md += `| Failed | ❌ ${result.failedCases} |\n`;
    md += `| Warnings | ⚠️ ${result.warningCases} |\n`;
    md += `| Pass Rate | ${((result.passedCases / result.totalCases) * 100).toFixed(2)}% |\n`;
    md += `| Total Execution Time | ${result.totalExecutionTime}ms |\n`;

    return md;
  }

  private generateAggregatedScores(result: TestSuiteResult): string {
    let md = `## Aggregated Scores\n\n`;
    md += `| Score Type | Value |\n`;
    md += `|------------|-------|\n`;
    md += `| Overall Score | ${result.aggregatedScoring.averageScore.toFixed(2)}/100 |\n`;
    md += `| Completeness Score | ${result.aggregatedScoring.averageCompleteness.toFixed(2)}/100 |\n`;
    md += `| Accuracy Score | ${result.aggregatedScoring.averageAccuracy.toFixed(2)}/100 |\n`;

    return md;
  }

  private generateCaseReport(testCase: TestCaseResult): string {
    let md = `### Case: ${testCase.caseId}\n\n`;

    if (testCase.description) {
      md += `**Description**: ${testCase.description}\n\n`;
    }

    const statusEmoji =
      testCase.status === 'passed'
        ? '✅'
        : testCase.status === 'warning'
        ? '⚠️'
        : '❌';
    md += `**Status**: ${statusEmoji} ${testCase.status.toUpperCase()}\n`;
    md += `**Execution Time**: ${testCase.executionTime}ms\n\n`;

    if (testCase.error) {
      md += `**Error**: ${testCase.error.message}\n\n`;
      return md;
    }

    // Scoring
    md += `#### Scores\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Overall Score | ${testCase.scoring.overallScore.toFixed(2)}/100 |\n`;
    md += `| Completeness Score | ${testCase.scoring.completenessScore.toFixed(2)}/100 |\n`;
    md += `| Accuracy Score | ${testCase.scoring.accuracyScore.toFixed(2)}/100 |\n`;
    md += `| Extra Fields Score | ${testCase.scoring.extraFieldScore.toFixed(2)}/100 |\n\n`;

    // Breakdown
    md += `#### Field Breakdown\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Fields | ${testCase.scoring.breakdown.totalFields} |\n`;
    md += `| Matched Fields | ✅ ${testCase.scoring.breakdown.matchedFields} |\n`;
    md += `| Missing Fields | ❌ ${testCase.scoring.breakdown.missingFields} |\n`;
    md += `| Mismatched Fields | ⚠️ ${testCase.scoring.breakdown.mismatchedFields} |\n`;
    md += `| Extra Fields | 🔷 ${testCase.scoring.breakdown.extraFields} |\n\n`;

    // Comparison details
    const comparison = testCase.comparison;

    if (comparison.mismatches.length > 0) {
      md += `#### Mismatches\n\n`;
      md += `| Field | Ground Truth | Actual | Type |\n`;
      md += `|-------|--------------|--------|------|\n`;
      for (const mismatch of comparison.mismatches) {
        const gtStr = this.truncate(JSON.stringify(mismatch.groundTruth), 50);
        const actualStr = this.truncate(JSON.stringify(mismatch.actual), 50);
        md += `| ${mismatch.path} | \`${gtStr}\` | \`${actualStr}\` | ${mismatch.type} |\n`;
      }
      md += `\n`;
    }

    if (comparison.missing.length > 0) {
      md += `#### Missing Fields\n\n`;
      md += `| Field | Expected Value |\n`;
      md += `|-------|-----------------|\n`;
      for (const missing of comparison.missing) {
        const valueStr = this.truncate(JSON.stringify(missing.expectedValue), 50);
        md += `| ${missing.path} | \`${valueStr}\` |\n`;
      }
      md += `\n`;
    }

    if (comparison.extra.length > 0) {
      md += `#### Extra Fields\n\n`;
      md += `| Field | Value |\n`;
      md += `|-------|-------|\n`;
      for (const extra of comparison.extra) {
        const valueStr = this.truncate(JSON.stringify(extra.value), 50);
        md += `| ${extra.path} | \`${valueStr}\` |\n`;
      }
      md += `\n`;
    }

    if (comparison.warnings.length > 0) {
      md += `#### Warnings\n\n`;
      for (const warning of comparison.warnings) {
        md += `- **${warning.path}**: ${warning.message}\n`;
      }
      md += `\n`;
    }

    return md;
  }

  private truncate(str: string, length: number): string {
    if (str.length > length) {
      return str.substring(0, length) + '...';
    }
    return str;
  }
}
