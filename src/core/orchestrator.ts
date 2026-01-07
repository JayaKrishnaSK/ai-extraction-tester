/**
 * Test Orchestrator
 * Coordinates test suite execution
 */

import { TestSuiteConfig, TestCaseResult, TestSuiteResult, ComparisonRules, ScoringConfig } from '../types';
import { DataFetcher } from './data-fetcher';
import { Comparator } from './comparator';
import { Scorer } from './scorer';
import { createLogger } from '../utils/logger';

const logger = createLogger('Orchestrator');

export class TestOrchestrator {
  private dataFetcher = new DataFetcher();
  private comparator = new Comparator();
  private scorer = new Scorer();

  async runSuite(config: TestSuiteConfig): Promise<TestSuiteResult> {
    const startTime = Date.now();
    logger.info(`Starting test suite: ${config.suite.name}`);

    const results: TestCaseResult[] = [];
    let passedCases = 0;
    let failedCases = 0;
    let warningCases = 0;

    // Get concurrency settings
    const maxParallel = config.concurrency?.maxParallel || 3;
    const delayBetweenRequests = config.concurrency?.delayBetweenRequests || 100;

    // Run cases with controlled concurrency
    const caseResults = await this.runCasesWithConcurrency(
      config.cases,
      config,
      maxParallel,
      delayBetweenRequests
    );

    // Aggregate results
    for (const result of caseResults) {
      results.push(result);
      if (result.status === 'passed') passedCases++;
      else if (result.status === 'failed') failedCases++;
      else warningCases++;
    }

    const totalExecutionTime = Date.now() - startTime;

    // Calculate aggregated scoring
    const avgScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.scoring.overallScore, 0) / results.length
        : 0;
    const avgCompleteness =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.scoring.completenessScore, 0) / results.length
        : 0;
    const avgAccuracy =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.scoring.accuracyScore, 0) / results.length
        : 0;

    const suiteResult: TestSuiteResult = {
      suiteId: config.suite.name.toLowerCase().replace(/\s+/g, '-'),
      suiteName: config.suite.name,
      version: config.version,
      serviceVersion: config.suite.serviceVersion,
      executedAt: new Date(),
      totalCases: config.cases.length,
      passedCases,
      failedCases,
      warningCases,
      cases: results,
      aggregatedScoring: {
        averageScore: Math.round(avgScore * 100) / 100,
        averageCompleteness: Math.round(avgCompleteness * 100) / 100,
        averageAccuracy: Math.round(avgAccuracy * 100) / 100,
      },
      totalExecutionTime,
    };

    logger.info(
      `Test suite completed: ${passedCases} passed, ${failedCases} failed, ${warningCases} warnings`,
      { totalTime: `${totalExecutionTime}ms` }
    );

    return suiteResult;
  }

  private async runCasesWithConcurrency(
    cases: any[],
    config: TestSuiteConfig,
    maxParallel: number,
    delayBetweenRequests: number
  ): Promise<TestCaseResult[]> {
    const results: TestCaseResult[] = [];
    let activeCount = 0;
    let caseIndex = 0;

    const queue = [...cases];

    return new Promise((resolve) => {
      const processNext = async () => {
        if (queue.length === 0 && activeCount === 0) {
          resolve(results);
          return;
        }

        if (activeCount < maxParallel && queue.length > 0) {
          const testCase = queue.shift()!;
          activeCount++;

          try {
            const result = await this.runCase(testCase, config);
            results.push(result);
          } catch (error) {
            logger.error(`Case ${testCase.id} execution error`, error);
            results.push({
              caseId: testCase.id,
              status: 'failed',
              executedAt: new Date(),
              comparison: {
                passed: false,
                mismatches: [],
                missing: [],
                extra: [],
                warnings: [],
              },
              scoring: {
                overallScore: 0,
                completenessScore: 0,
                accuracyScore: 0,
                extraFieldScore: 0,
                fieldScores: [],
                breakdown: {
                  totalFields: 0,
                  matchedFields: 0,
                  missingFields: 0,
                  mismatchedFields: 0,
                  extraFields: 0,
                },
              },
              executionTime: 0,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'EXECUTION_ERROR',
              },
            });
          }

          activeCount--;
          setTimeout(processNext, delayBetweenRequests);
        }
      };

      // Start initial batch
      for (let i = 0; i < maxParallel && queue.length > 0; i++) {
        processNext();
      }
    });
  }

  private async runCase(
    testCase: any,
    config: TestSuiteConfig
  ): Promise<TestCaseResult> {
    const startTime = Date.now();
    logger.info(`Running test case: ${testCase.id}`);

    try {
      // Merge defaults with case-specific config
      const comparisonRules: ComparisonRules = {
        ...config.defaults?.comparison,
        ...testCase.comparison,
      };

      const scoringConfig: ScoringConfig = {
        ...config.defaults?.scoring,
        ...testCase.scoring,
      };

      // Fetch input
      const input = await this.dataFetcher.fetchData(testCase.input, config.auth);

      // Fetch ground truth
      const groundTruth = await this.dataFetcher.fetchData(testCase.groundTruth, config.auth);

      // Execute service
      const output = await this.dataFetcher.executeService(
        testCase.execution.endpoint,
        testCase.execution.method || 'POST',
        input,
        config.auth
      );

      // Compare
      const comparison = this.comparator.compare(groundTruth, output, comparisonRules);

      // Score
      const scoring = this.scorer.score(comparison, scoringConfig);

      // Determine status
      let status: 'passed' | 'failed' | 'warning' = 'passed';
      if (!comparison.passed) status = 'failed';
      else if (comparison.warnings.length > 0) status = 'warning';

      const executionTime = Date.now() - startTime;

      return {
        caseId: testCase.id,
        description: testCase.description,
        status,
        executedAt: new Date(),
        comparison,
        scoring,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        caseId: testCase.id,
        description: testCase.description,
        status: 'failed',
        executedAt: new Date(),
        comparison: {
          passed: false,
          mismatches: [],
          missing: [],
          extra: [],
          warnings: [],
        },
        scoring: {
          overallScore: 0,
          completenessScore: 0,
          accuracyScore: 0,
          extraFieldScore: 0,
          fieldScores: [],
          breakdown: {
            totalFields: 0,
            matchedFields: 0,
            missingFields: 0,
            mismatchedFields: 0,
            extraFields: 0,
          },
        },
        executionTime,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'EXECUTION_ERROR',
        },
      };
    }
  }
}
