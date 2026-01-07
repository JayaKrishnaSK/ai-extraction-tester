/**
 * Express API Server
 * HTTP interface for running tests
 */

import express, { Express, Request, Response } from 'express';
import { ConfigLoader } from '../config/config-loader';
import { TestOrchestrator } from '../core/orchestrator';
import { MarkdownReporter } from '../reporters/markdown-reporter';
import { JsonReporter } from '../reporters/json-reporter';
import { createLogger } from '../utils/logger';

const logger = createLogger('API');
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Run test suite from config
app.post('/run-suite', async (req: Request, res: Response) => {
  try {
    const { config, format = 'json' } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    logger.info('Running test suite from API');

    // Load and validate config
    const configLoader = new ConfigLoader();
    const testConfig = configLoader.loadFromObject(config);

    // Execute tests
    const orchestrator = new TestOrchestrator();
    const result = await orchestrator.runSuite(testConfig);

    // Format response
    if (format === 'markdown') {
      const mdReporter = new MarkdownReporter();
      const report = mdReporter.generate(result);
      res.set('Content-Type', 'text/markdown');
      res.send(report);
    } else {
      const jsonReporter = new JsonReporter();
      const report = JSON.parse(jsonReporter.generate(result));
      res.json(report);
    }
  } catch (error) {
    logger.error('Suite execution failed', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Run specific test suite by ID/Name
app.post('/run-suite/:suiteId', async (req: Request, res: Response) => {
  try {
    const { suiteId } = req.params;
    const { config, format = 'json' } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    logger.info(`Running test suite: ${suiteId}`);

    const configLoader = new ConfigLoader();
    const testConfig = configLoader.loadFromObject(config);

    const orchestrator = new TestOrchestrator();
    const result = await orchestrator.runSuite(testConfig);

    if (format === 'markdown') {
      const mdReporter = new MarkdownReporter();
      const report = mdReporter.generate(result);
      res.set('Content-Type', 'text/markdown');
      res.send(report);
    } else {
      const jsonReporter = new JsonReporter();
      const report = JSON.parse(jsonReporter.generate(result));
      res.json(report);
    }
  } catch (error) {
    logger.error('Suite execution failed', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Validation endpoint - just validate config
app.post('/validate-config', (req: Request, res: Response) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    logger.info('Validating config');

    const configLoader = new ConfigLoader();
    const validated = configLoader.loadFromObject(config);

    res.json({
      valid: true,
      suite: {
        name: validated.suite.name,
        cases: validated.cases.length,
        version: validated.version,
      },
    });
  } catch (error) {
    res.status(400).json({
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid config',
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  logger.error('Express error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 AI Extraction Tester API listening on port ${port}`);
  logger.info(`POST /run-suite - Run test suite from config`);
  logger.info(`POST /validate-config - Validate config file`);
  logger.info(`GET /health - Health check`);
});

export default app;
