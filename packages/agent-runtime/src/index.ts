export type RuntimeEventType =
  | "goal.started"
  | "step.planned"
  | "step.executed"
  | "step.evaluated"
  | "goal.completed"
  | "goal.failed";

export interface RuntimeEventMetadata {
  agentId?: string;
  executionId?: string;
  requestId?: string;
  stepId?: string;
  timestamp?: string;
  toolId?: string;
}

export interface RuntimeEvent {
  meta?: RuntimeEventMetadata;
  payload: Record<string, unknown>;
  type: RuntimeEventType;
}

export type RuntimeStep = {
  id: string;
  description: string;
  dependsOn: string[];
};

export class RuntimeGraph {
  private readonly steps = new Map<string, RuntimeStep>();

  addStep(step: RuntimeStep): void {
    if (this.steps.has(step.id)) {
      throw new Error(`duplicate_step:${step.id}`);
    }
    if (step.dependsOn.includes(step.id)) {
      throw new Error(`self_dependency:${step.id}`);
    }
    this.steps.set(step.id, step);
  }

  topologicalOrder(): RuntimeStep[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const output: RuntimeStep[] = [];

    const dfs = (id: string) => {
      if (visiting.has(id)) throw new Error("cycle_detected");
      if (visited.has(id)) return;
      const step = this.steps.get(id);
      if (!step) throw new Error(`missing_step:${id}`);
      visiting.add(id);
      for (const dep of step.dependsOn) dfs(dep);
      visiting.delete(id);
      visited.add(id);
      output.push(step);
    };

    for (const id of this.steps.keys()) dfs(id);
    return output;
  }
}
