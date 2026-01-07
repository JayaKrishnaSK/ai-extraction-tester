/**
 * Comparator Engine
 * Deep JSON comparison with schema inference, exclusions, and field tracking
 */

import { ComparisonRules, ComparisonResult } from '../types';
import { SchemaInferrer } from './schema-inference';

export class Comparator {
  private schemaInferrer = new SchemaInferrer();

  compare(
    groundTruth: any,
    actual: any,
    rules: ComparisonRules
  ): ComparisonResult {
    const result: ComparisonResult = {
      passed: true,
      mismatches: [],
      missing: [],
      extra: [],
      warnings: [],
    };

    // Infer schema from ground truth
    const schema = this.schemaInferrer.infer(groundTruth);
    const ignoreSet = new Set(rules.ignoreFields || []);

    // Compare each field from ground truth
    this.compareObject(groundTruth, actual, '', ignoreSet, result, rules);

    // Detect extra fields in actual
    this.detectExtraFields(groundTruth, actual, '', ignoreSet, result);

    // Check if test passed (no critical mismatches)
    result.passed =
      result.mismatches.length === 0 &&
      result.missing.length === 0 &&
      (result.extra.length === 0 || !rules.extraFieldsWarning);

    return result;
  }

  private compareObject(
    gt: any,
    actual: any,
    path: string,
    ignoreSet: Set<string>,
    result: ComparisonResult,
    rules: ComparisonRules
  ): void {
    // Null/undefined checks
    if (gt === null && actual === null) return;
    if (gt === null || actual === null) {
      result.mismatches.push({
        path: path || 'root',
        groundTruth: gt,
        actual: actual,
        type: 'value',
      });
      return;
    }

    // Array handling
    if (Array.isArray(gt)) {
      if (!Array.isArray(actual)) {
        result.mismatches.push({
          path,
          groundTruth: gt,
          actual,
          type: 'type',
        });
        return;
      }

      // Check array items
      if (gt.length === 0 && actual.length === 0) return;

      if (gt.length > 0 && typeof gt[0] === 'object') {
        // Array of objects
        this.compareObjectArrays(gt, actual, path, ignoreSet, result, rules);
      } else {
        // Array of primitives
        this.compareArrays(gt, actual, path, ignoreSet, result, rules);
      }
      return;
    }

    // Object handling
    if (typeof gt === 'object') {
      if (typeof actual !== 'object' || actual === null) {
        result.mismatches.push({
          path,
          groundTruth: gt,
          actual,
          type: 'type',
        });
        return;
      }

      for (const key of Object.keys(gt)) {
        const fieldPath = path ? `${path}.${key}` : key;

        if (ignoreSet.has(fieldPath)) continue;

        if (!(key in actual)) {
          result.missing.push({
            path: fieldPath,
            expectedValue: gt[key],
          });
        } else {
          this.compareObject(
            gt[key],
            actual[key],
            fieldPath,
            ignoreSet,
            result,
            rules
          );
        }
      }
      return;
    }

    // Primitive comparison
    this.comparePrimitives(gt, actual, path, result, rules);
  }

  private comparePrimitives(
    gt: any,
    actual: any,
    path: string,
    result: ComparisonResult,
    rules: ComparisonRules
  ): void {
    // Type coercion handling
    if (rules.typeCoercion && typeof gt !== typeof actual) {
      // Try numeric comparison
      if (
        (typeof gt === 'number' && typeof actual === 'string') ||
        (typeof gt === 'string' && typeof actual === 'number')
      ) {
        const gtNum = Number(gt);
        const actualNum = Number(actual);

        if (!isNaN(gtNum) && !isNaN(actualNum)) {
          if (Math.abs(gtNum - actualNum) <= rules.numericTolerance) {
            return; // Match
          }
          result.mismatches.push({
            path,
            groundTruth: gt,
            actual,
            type: 'numeric',
          });
          return;
        }
      }
      // String comparison for numbers
      if (String(gt) === String(actual)) return;
    }

    // Numeric tolerance check
    if (typeof gt === 'number' && typeof actual === 'number') {
      if (Math.abs(gt - actual) <= rules.numericTolerance) {
        return;
      }
      result.mismatches.push({
        path,
        groundTruth: gt,
        actual,
        type: 'numeric',
      });
      return;
    }

    // Direct comparison
    if (gt !== actual) {
      result.mismatches.push({
        path,
        groundTruth: gt,
        actual,
        type: 'value',
      });
    }
  }

  private compareArrays(
    gt: any[],
    actual: any[],
    path: string,
    ignoreSet: Set<string>,
    result: ComparisonResult,
    rules: ComparisonRules
  ): void {
    if (rules.arrayStrategy === 'ordered') {
      // Ordered comparison
      const maxLen = Math.max(gt.length, actual.length);
      for (let i = 0; i < maxLen; i++) {
        const itemPath = `${path}[${i}]`;
        if (i >= gt.length) {
          result.extra.push({
            path: itemPath,
            value: actual[i],
          });
        } else if (i >= actual.length) {
          result.missing.push({
            path: itemPath,
            expectedValue: gt[i],
          });
        } else {
          this.compareObject(
            gt[i],
            actual[i],
            itemPath,
            ignoreSet,
            result,
            rules
          );
        }
      }
    } else {
      // Unordered comparison - convert to sets for primitives
      const gtSet = new Set(gt.map(String));
      const actualSet = new Set(actual.map(String));

      for (const item of gt) {
        if (!actualSet.has(String(item))) {
          result.missing.push({
            path: `${path}[]`,
            expectedValue: item,
          });
        }
      }

      for (const item of actual) {
        if (!gtSet.has(String(item))) {
          result.extra.push({
            path: `${path}[]`,
            value: item,
          });
        }
      }

      // Warn about order if lengths match
      if (
        gt.length === actual.length &&
        JSON.stringify(gt) !== JSON.stringify(actual)
      ) {
        result.warnings.push({
          path,
          message: `Array order differs (unordered comparison enabled)`,
        });
      }
    }
  }

  private compareObjectArrays(
    gt: any[],
    actual: any[],
    path: string,
    ignoreSet: Set<string>,
    result: ComparisonResult,
    rules: ComparisonRules
  ): void {
    // For object arrays, compare element by element
    // In unordered mode, just compare each element exists
    const maxLen = Math.max(gt.length, actual.length);

    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`;
      if (i >= gt.length) {
        result.extra.push({
          path: itemPath,
          value: actual[i],
        });
      } else if (i >= actual.length) {
        result.missing.push({
          path: itemPath,
          expectedValue: gt[i],
        });
      } else {
        this.compareObject(
          gt[i],
          actual[i],
          itemPath,
          ignoreSet,
          result,
          rules
        );
      }
    }
  }

  private detectExtraFields(
    gt: any,
    actual: any,
    path: string,
    ignoreSet: Set<string>,
    result: ComparisonResult
  ): void {
    if (typeof actual !== 'object' || actual === null) return;

    // For primitive types in GT, skip
    if (typeof gt !== 'object' || gt === null) return;

    if (Array.isArray(actual) && Array.isArray(gt)) {
      // Already handled in compareArrays
      return;
    }

    if (Array.isArray(actual) || Array.isArray(gt)) return;

    // Check for extra keys in actual
    for (const key of Object.keys(actual)) {
      const fieldPath = path ? `${path}.${key}` : key;

      if (ignoreSet.has(fieldPath) || ignoreSet.has(key)) continue;

      if (!(key in gt)) {
        result.extra.push({
          path: fieldPath,
          value: actual[key],
        });
      } else if (typeof actual[key] === 'object' && typeof gt[key] === 'object') {
        this.detectExtraFields(
          gt[key],
          actual[key],
          fieldPath,
          ignoreSet,
          result
        );
      }
    }
  }
}
