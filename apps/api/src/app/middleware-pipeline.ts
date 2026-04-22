import type { ApiConfig } from "@birthub/config";
import express from "express";
import type { Express, Handler, NextFunction, Request, Response } from "express";

/**
 * Declarative middleware pipeline with composition and reusability
 */

export type PipelinePhase = "pre-context" | "context" | "pre-validation" | "validation" | "pre-transform" | "transform" | "post-transform" | "error-handling" | "terminal";

export interface PipelineMiddleware {
  name: string;
  phase: PipelinePhase;
  priority: number; // Lower = runs first within phase
  factory: (config: ApiConfig) => Handler | Promise<Handler>;
  enabled?: (config: ApiConfig) => boolean;
}

export interface PipelineConfig {
  config: ApiConfig;
  middlewares: PipelineMiddleware[];
  errorHandler?: Handler;
  notFoundHandler?: Handler;
}

class MiddlewarePipeline {
  private middlewares: Map<PipelinePhase, PipelineMiddleware[]> = new Map([
    ["pre-context", []],
    ["context", []],
    ["pre-validation", []],
    ["validation", []],
    ["pre-transform", []],
    ["transform", []],
    ["post-transform", []],
    ["error-handling", []],
    ["terminal", []]
  ]);

  register(middleware: PipelineMiddleware): void {
    const phase = this.middlewares.get(middleware.phase);
    if (!phase) {
      throw new Error(`Unknown pipeline phase: ${middleware.phase}`);
    }
    phase.push(middleware);
    phase.sort((a, b) => a.priority - b.priority);
  }

  async apply(app: Express, config: ApiConfig): Promise<void> {
    const phases: PipelinePhase[] = [
      "pre-context",
      "context",
      "pre-validation",
      "validation",
      "pre-transform",
      "transform",
      "post-transform",
      "error-handling",
      "terminal"
    ];

    for (const phase of phases) {
      const middlewares = this.middlewares.get(phase) ?? [];
      for (const mw of middlewares) {
        if (mw.enabled && !mw.enabled(config)) {
          continue;
        }
        const handler = await mw.factory(config);
        app.use(handler);
      }
    }
  }

  getMiddlewares(phase: PipelinePhase): PipelineMiddleware[] {
    return this.middlewares.get(phase) ?? [];
  }
}

export const pipeline = new MiddlewarePipeline();

/**
 * Helper to create middleware definitions
 */
export function definePipelineMiddleware(
  name: string,
  phase: PipelinePhase,
  priority: number,
  factory: (config: ApiConfig) => Handler | Promise<Handler>,
  enabled?: (config: ApiConfig) => boolean
): PipelineMiddleware {
  return { name, phase, priority, factory, enabled };
}

/**
 * Apply the entire pipeline to an Express app
 */
export async function applyMiddlewarePipeline(app: Express, config: ApiConfig): Promise<void> {
  await pipeline.apply(app, config);
}

/**
 * Helper for applying conditional middleware sets
 */
export function createConditionalPipelineSet(
  condition: (config: ApiConfig) => boolean,
  middlewares: PipelineMiddleware[]
): PipelineMiddleware[] {
  return middlewares.map((mw) => ({
    ...mw,
    enabled: (config: ApiConfig) => condition(config) && (mw.enabled?.(config) ?? true)
  }));
}

export function getPipeline() {
  return pipeline;
}
