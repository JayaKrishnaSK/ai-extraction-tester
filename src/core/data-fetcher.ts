/**
 * Data Fetcher Layer
 * Handles fetching ground truth and executing service calls
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { DataSource, Auth } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('DataFetcher');

export class DataFetcher {
  async fetchData(source: DataSource, auth?: Auth): Promise<any> {
    switch (source.type) {
      case 'file':
        return this.fetchFromFile(source.path);
      case 'api':
        return this.fetchFromApi(
          source.endpoint,
          source.method || 'POST',
          source.body,
          auth
        );
      case 'json':
        return this.fetchJson(source.source);
      default:
        throw new Error(`Unknown data source type`);
    }
  }

  private fetchFromFile(filePath: string): any {
    try {
      const absolutePath = path.resolve(filePath);
      const content = fs.readFileSync(absolutePath, 'utf-8');

      // Try to parse as JSON
      if (filePath.endsWith('.json')) {
        return JSON.parse(content);
      }

      // Otherwise return as base64 encoded string for binary files
      return Buffer.from(content).toString('base64');
    } catch (error) {
      logger.error(`Failed to read file ${filePath}`, error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  private async fetchFromApi(
    endpoint: string,
    method: string,
    body?: any,
    auth?: Auth
  ): Promise<any> {
    try {
      const headers: Record<string, string> = {};

      // Add auth headers
      if (auth) {
        if (auth.type === 'bearer') {
          const token = process.env[auth.tokenEnv];
          if (!token) {
            throw new Error(`Bearer token not found in env: ${auth.tokenEnv}`);
          }
          headers['Authorization'] = `Bearer ${token}`;
        } else if (auth.type === 'api-key') {
          const key = process.env[auth.keyEnv];
          if (!key) {
            throw new Error(`API key not found in env: ${auth.keyEnv}`);
          }
          headers[auth.headerName || 'X-API-Key'] = key;
        }
      }

      const config: any = {
        method: method.toLowerCase(),
        url: endpoint,
        headers,
      };

      if (body) {
        config.data = body;
      }

      logger.debug(`Fetching from API: ${endpoint}`);
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`API request failed: ${endpoint}`, error);
      throw new Error(`Failed to fetch from API: ${endpoint}`);
    }
  }

  private fetchJson(source: string | any): any {
    if (typeof source === 'string') {
      // It's a file path
      return this.fetchFromFile(source);
    }
    // It's inline JSON
    return source;
  }

  /**
   * Execute extraction service
   */
  async executeService(
    endpoint: string,
    method: string,
    input: any,
    auth?: Auth
  ): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (auth) {
        if (auth.type === 'bearer') {
          const token = process.env[auth.tokenEnv];
          if (!token) {
            throw new Error(`Bearer token not found in env: ${auth.tokenEnv}`);
          }
          headers['Authorization'] = `Bearer ${token}`;
        } else if (auth.type === 'api-key') {
          const key = process.env[auth.keyEnv];
          if (!key) {
            throw new Error(`API key not found in env: ${auth.keyEnv}`);
          }
          headers[auth.headerName || 'X-API-Key'] = key;
        }
      }

      logger.debug(`Executing service: ${endpoint}`);
      const response = await axios({
        method: method.toLowerCase(),
        url: endpoint,
        data: input,
        headers,
      });

      return response.data;
    } catch (error) {
      logger.error(`Service execution failed: ${endpoint}`, error);
      throw error;
    }
  }
}
