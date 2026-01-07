/**
 * Configuration Loader
 * Loads and validates YAML/JSON config files
 */

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { TestSuiteConfigSchema, TestSuiteConfig } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ConfigLoader');

export class ConfigLoader {
  loadFromFile(filePath: string): TestSuiteConfig {
    try {
      const absolutePath = path.resolve(filePath);
      logger.info(`Loading config from: ${absolutePath}`);

      const content = fs.readFileSync(absolutePath, 'utf-8');
      let parsed: any;

      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        parsed = YAML.parse(content);
      } else if (filePath.endsWith('.json')) {
        parsed = JSON.parse(content);
      } else {
        throw new Error('Config file must be .yaml, .yml, or .json');
      }

      // Validate against schema
      const validated = TestSuiteConfigSchema.parse(parsed);
      logger.info(`Config validated successfully. Cases: ${validated.cases.length}`);
      return validated;
    } catch (error) {
      logger.error(`Failed to load config: ${filePath}`, error);
      throw error;
    }
  }

  loadFromObject(config: any): TestSuiteConfig {
    try {
      const validated = TestSuiteConfigSchema.parse(config);
      logger.info(`Config validated successfully. Cases: ${validated.cases.length}`);
      return validated;
    } catch (error) {
      logger.error('Failed to validate config object', error);
      throw error;
    }
  }
}
