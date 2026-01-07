/**
 * Schema Inference Engine
 * Infers structure from ground truth JSON for comparison
 */

export interface SchemaField {
  path: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  isArray: boolean;
  isRequired: boolean; // presence in GT means it's "required"
  sampleValues: any[];
}

export interface InferredSchema {
  fields: Map<string, SchemaField>;
  totalFields: number;
}

export class SchemaInferrer {
  infer(data: any, prefix = ''): InferredSchema {
    const fields = new Map<string, SchemaField>();
    this.traverseObject(data, prefix, fields);
    return {
      fields,
      totalFields: fields.size,
    };
  }

  private traverseObject(
    obj: any,
    prefix: string,
    fields: Map<string, SchemaField>
  ): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      // Handle arrays
      const arrayPath = prefix;
      if (obj.length > 0) {
        const firstItem = obj[0];
        const itemType = typeof firstItem;

        if (itemType === 'object' && firstItem !== null) {
          // Array of objects - recurse
          this.traverseObject(firstItem, `${arrayPath}[]`, fields);
        } else {
          // Array of primitives
          fields.set(arrayPath, {
            path: arrayPath,
            type: this.getType(firstItem),
            isArray: true,
            isRequired: true,
            sampleValues: obj.slice(0, 3),
          });
        }
      }
      return;
    }

    if (typeof obj === 'object') {
      // Handle objects
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;

        if (value === null) {
          fields.set(fieldPath, {
            path: fieldPath,
            type: 'null',
            isArray: false,
            isRequired: true,
            sampleValues: [null],
          });
          continue;
        }

        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
            this.traverseObject(value[0], `${fieldPath}[]`, fields);
          } else {
            fields.set(fieldPath, {
              path: fieldPath,
              type: this.getType(value[0] || ''),
              isArray: true,
              isRequired: true,
              sampleValues: value.slice(0, 3),
            });
          }
        } else if (typeof value === 'object') {
          this.traverseObject(value, fieldPath, fields);
        } else {
          fields.set(fieldPath, {
            path: fieldPath,
            type: this.getType(value),
            isArray: false,
            isRequired: true,
            sampleValues: [value],
          });
        }
      }
    }
  }

  private getType(
    value: any
  ): 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'object';
  }

  /**
   * Get all field paths in a normalized format
   */
  getFieldPaths(schema: InferredSchema): string[] {
    return Array.from(schema.fields.keys());
  }
}
