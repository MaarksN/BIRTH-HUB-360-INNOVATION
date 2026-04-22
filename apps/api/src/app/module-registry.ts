import type { ApiConfig } from "@birthub/config";
import type { Express, Router } from "express";

/**
 * Módulo de rota com metadados de prioridade e prefixo
 */
export interface RegisteredModule {
  name: string;
  basePath: string;
  priority: number; // Menor número = maior prioridade (auth=0, depois business logic=100, depois fallback=1000)
  createRouter: (config: ApiConfig) => Router | Promise<Router>;
}

/**
 * Registro centralizado de módulos
 */
class ModuleRegistry {
  private modules: Map<string, RegisteredModule> = new Map();

  register(module: RegisteredModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module '${module.name}' already registered`);
    }
    this.modules.set(module.name, module);
  }

  getModules(): RegisteredModule[] {
    return Array.from(this.modules.values()).sort((a, b) => a.priority - b.priority);
  }

  has(name: string): boolean {
    return this.modules.has(name);
  }

  get(name: string): RegisteredModule | undefined {
    return this.modules.get(name);
  }
}

export const globalModuleRegistry = new ModuleRegistry();

export async function mountRegisteredModules(app: Express, config: ApiConfig): Promise<void> {
  const modules = globalModuleRegistry.getModules();

  for (const module of modules) {
    const router = await module.createRouter(config);
    const fullPath = module.basePath.startsWith("/") ? module.basePath : `/${module.basePath}`;
    app.use(fullPath, router);
  }
}

/**
 * Auto-register modules from a directory pattern
 */
export async function autoRegisterModules(baseDir: string, pattern: string = "**/module.ts"): Promise<void> {
  // Esta função seria usada em runtime para descobrir módulos automaticamente
  // Requer glob ou fs.readdirSync para varrer diretórios
  // Implementação depende de seu setup de build
}
