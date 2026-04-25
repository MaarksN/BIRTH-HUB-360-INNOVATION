sed -i 's/} as unknown,/\} as any,/g' apps/worker/src/agents/runtime.handoff-queue.ts
sed -i 's/} as unknown/\} as any/g' apps/worker/src/agents/runtime.handoff-queue.ts
sed -i 's/} as unknown/\} as any/g' apps/worker/src/agents/runtime.observability.ts
sed -i 's/} as unknown/\} as any/g' apps/worker/src/agents/runtime.orchestration.ts
sed -i 's/} as unknown/\} as any/g' apps/worker/src/agents/runtime.tool-registry.ts
