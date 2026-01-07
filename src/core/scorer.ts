/**
 * Scoring Engine
 * Transforms comparison results into numeric scores and metrics
 */

import { ComparisonResult, ScoringResult, FieldScore, ScoringConfig } from '../types';

export class Scorer {
  score(
    comparison: ComparisonResult,
    config: ScoringConfig
  ): ScoringResult {
    const schema = this.extractSchema(comparison);
    const totalFields = schema.size;

    if (totalFields === 0) {
      return this.emptyResult();
    }

    const matchedFields = totalFields - comparison.missing.length - comparison.mismatches.length;
    const fieldScores: FieldScore[] = [];

    // Score matched fields
    for (const field of schema) {
      const isMissing = comparison.missing.some((m) => m.path === field);
      const isMismatched = comparison.mismatches.some((m) => m.path === field);
      const isExtra = comparison.extra.some((e) => e.path === field);

      if (isMissing) {
        fieldScores.push({
          field,
          score: 0,
          penalty: config.missingFieldPenalty,
          reason: 'Field missing in output',
        });
      } else if (isMismatched) {
        fieldScores.push({
          field,
          score: 50,
          penalty: config.mismatchPenalty,
          reason: 'Field value mismatch',
        });
      } else if (!isExtra) {
        fieldScores.push({
          field,
          score: 100,
          penalty: 0,
          reason: 'Perfect match',
        });
      }
    }

    // Score extra fields
    for (const extra of comparison.extra) {
      fieldScores.push({
        field: extra.path,
        score: 75, // Extra fields get partial credit
        penalty: config.extraFieldPenalty,
        reason: 'Extra field in output',
      });
    }

    // Calculate scores
    const completenessScore = (matchedFields / totalFields) * 100;
    const accuracyScore =
      ((totalFields - comparison.mismatches.length) / totalFields) * 100;

    // Calculate weighted overall score
    let totalPenalty = 0;
    totalPenalty += comparison.missing.length * config.missingFieldPenalty;
    totalPenalty += comparison.mismatches.length * config.mismatchPenalty;
    totalPenalty += comparison.extra.length * config.extraFieldPenalty;

    const overallScore = Math.max(0, 100 - (totalPenalty / totalFields) * 10);
    const extraFieldScore = (comparison.extra.length / Math.max(totalFields, 1)) * 100;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      completenessScore: Math.round(completenessScore * 100) / 100,
      accuracyScore: Math.round(accuracyScore * 100) / 100,
      extraFieldScore: Math.round(extraFieldScore * 100) / 100,
      fieldScores,
      breakdown: {
        totalFields,
        matchedFields,
        missingFields: comparison.missing.length,
        mismatchedFields: comparison.mismatches.length,
        extraFields: comparison.extra.length,
      },
    };
  }

  private extractSchema(comparison: ComparisonResult): Set<string> {
    const schema = new Set<string>();

    // Add all fields that were compared
    comparison.mismatches.forEach((m) => schema.add(m.path));
    comparison.missing.forEach((m) => schema.add(m.path));

    return schema;
  }

  private emptyResult(): ScoringResult {
    return {
      overallScore: 100,
      completenessScore: 100,
      accuracyScore: 100,
      extraFieldScore: 0,
      fieldScores: [],
      breakdown: {
        totalFields: 0,
        matchedFields: 0,
        missingFields: 0,
        mismatchedFields: 0,
        extraFields: 0,
      },
    };
  }
}
