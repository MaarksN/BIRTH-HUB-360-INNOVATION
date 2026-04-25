import test from "node:test";
import assert from "node:assert/strict";
import { RuntimeGraph } from "../../src/index.ts";

test("runtime graph orders dependencies", () => {
  const graph = new RuntimeGraph();
  graph.addStep({ id: "a", description: "first", dependsOn: [] });
  graph.addStep({ id: "b", description: "second", dependsOn: ["a"] });
  const ordered = graph.topologicalOrder().map((s) => s.id);
  assert.deepEqual(ordered, ["a", "b"]);
});

test("runtime graph rejects duplicate step ids", () => {
  const graph = new RuntimeGraph();
  graph.addStep({ id: "a", description: "first", dependsOn: [] });
  assert.throws(
    () => graph.addStep({ id: "a", description: "duplicate", dependsOn: [] }),
    /duplicate_step:a/
  );
});

test("runtime graph rejects self dependencies", () => {
  const graph = new RuntimeGraph();
  assert.throws(
    () => graph.addStep({ id: "self", description: "invalid", dependsOn: ["self"] }),
    /self_dependency:self/
  );
});
