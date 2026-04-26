import type { Router } from "express";
import type { z } from "zod";

/**
 * Automatic OpenAPI documentation generation from route definitions
 */

export interface RouteDefinition {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<number, OpenAPIResponse>;
  security?: { [key: string]: string[] }[];
  deprecated?: boolean;
}

export interface OpenAPIParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description: string;
  required: boolean;
  schema: Record<string, unknown>;
  example?: unknown;
}

export interface OpenAPIRequestBody {
  description: string;
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: Record<string, unknown>;
      examples?: Record<string, unknown>;
    };
  };
}

export interface OpenAPIResponse {
  description: string;
  content?: {
    [mediaType: string]: {
      schema: Record<string, unknown>;
      examples?: Record<string, unknown>;
    };
  };
}

export class OpenAPIGenerator {
  private routes: Map<string, RouteDefinition> = new Map();
  private schemas: Map<string, z.ZodTypeAny> = new Map();

  /**
   * Register a route for documentation
   */
  registerRoute(definition: RouteDefinition): void {
    const key = `${definition.method} ${definition.path}`;
    this.routes.set(key, definition);
  }

  /**
   * Register a schema for reuse
   */
  registerSchema(name: string, schema: z.ZodTypeAny): void {
    this.schemas.set(name, schema);
  }

  /**
   * Generate OpenAPI 3.1.0 spec
   */
  generateSpec(config: {
    title: string;
    version: string;
    description?: string;
    baseUrl: string;
    securitySchemes?: Record<string, unknown>;
  }): Record<string, unknown> {
    return {
      openapi: "3.1.0",
      info: {
        title: config.title,
        version: config.version,
        description: config.description
      },
      servers: [
        {
          url: config.baseUrl,
          description: "API Server"
        }
      ],
      paths: this.generatePaths(),
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: config.securitySchemes ?? {}
      },
      tags: this.generateTags()
    };
  }

  /**
   * Generate paths section
   */
  private generatePaths(): Record<string, Record<string, unknown>> {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const [, route] of this.routes) {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      paths[route.path][route.method.toLowerCase()] = {
        summary: route.summary,
        description: route.description,
        tags: route.tags,
        parameters: this.generateParameters(route),
        requestBody: route.requestBody,
        responses: this.generateResponses(route),
        security: route.security,
        deprecated: route.deprecated ?? false
      };
    }

    return paths;
  }

  /**
   * Generate parameters
   */
  private generateParameters(route: RouteDefinition): OpenAPIParameter[] {
    if (!route.parameters) return [];

    return route.parameters.map((param) => ({
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required,
      schema: param.schema,
      example: param.example
    }));
  }

  /**
   * Generate responses
   */
  private generateResponses(route: RouteDefinition): Record<string, OpenAPIResponse> {
    const responses: Record<string, OpenAPIResponse> = {};

    for (const [code, response] of Object.entries(route.responses)) {
      responses[code] = {
        description: response.description,
        content: response.content
      };
    }

    return responses;
  }

  /**
   * Generate schemas
   */
  private generateSchemas(): Record<string, Record<string, unknown>> {
    const schemas: Record<string, Record<string, unknown>> = {};

    for (const [name, schema] of this.schemas) {
      schemas[name] = this.zodToOpenAPI(schema);
    }

    return schemas;
  }

  /**
   * Generate tags
   */
  private generateTags(): Array<{ description: string; name: string }> {
    const tags = new Set<string>();

    for (const [, route] of this.routes) {
      route.tags.forEach((tag) => tags.add(tag));
    }

    return Array.from(tags).map((tag) => ({
      name: tag,
      description: tag
    }));
  }

  /**
   * Convert Zod schema to OpenAPI schema
   */
  private zodToOpenAPI(_zodSchema: z.ZodTypeAny): Record<string, unknown> {
    // Simplified conversion - in production, use a library like @asteasolutions/zod-to-openapi
    return {
      type: "object",
      properties: {},
      required: []
    };
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteDefinition[] {
    return Array.from(this.routes.values());
  }

  /**
   * Export as JSON
   */
  exportJSON(config: Parameters<typeof this.generateSpec>[0]): string {
    return JSON.stringify(this.generateSpec(config), null, 2);
  }
}

/**
 * Helper to create route definition
 */
export function defineRoute(definition: RouteDefinition): RouteDefinition {
  return {
    deprecated: false,
    ...definition
  };
}

/**
 * Middleware to attach OpenAPI generator to app
 */
export function openAPIGeneratorMiddleware(generator: OpenAPIGenerator) {
  return (req: any, _res: any, next: any) => {
    req.openAPI = generator;
    next();
  };
}
