import { describe, test } from "node:test";
import assert from "node:assert";

import { suggestWorkflows, suggestEnrichment } from "../src/ai/suggest.js";
import { adaptTemplate } from "../src/ai/templates.js";
import { generateWorkflowFromPrompt } from "../src/ai/copilot.js";
import { analyzeFailure } from "../src/ai/autoHealing.js";
import { detectProviderDegradation } from "../src/ai/anomalyDetection.js";
import { explainDecision } from "../src/ai/explainability.js";
import { evaluateActionRisk } from "../src/ai/governance.js";

describe("AI & Advanced Automation", () => {
  test("suggestWorkflows handles billing recovery", () => {
    const suggestions = suggestWorkflows({ events: ['payment_failed'], activeConnectors: ['stripe'] });
    assert.strictEqual(suggestions.length, 1);
    assert.strictEqual(suggestions[0].id, 'billing_recovery');
  });

  test("suggestEnrichment handles email to company", () => {
    const suggestions = suggestEnrichment({ fields: { email: 'test@example.com' } });
    assert.strictEqual(suggestions.length, 1);
    assert.strictEqual(suggestions[0].field, 'company');
  });

  test("adaptTemplate preserves identity and sets metadata", () => {
    const template = adaptTemplate('tpl_billing_01', { tenantId: 'tenant-123', industry: 'tech' });
    assert.ok(template);
    assert.strictEqual(template?.metadata?.adaptedIndustry, 'tech');
    assert.ok(template?.name.includes('tenant-123'));
  });

  test("copilot correctly identifies billing intent", () => {
    const response = generateWorkflowFromPrompt("crie um fluxo de cobrança urgente");
    assert.strictEqual(response.intent, 'billing_workflow');
  });

  test("autoHealing classifies operational errors correctly", () => {
    const analysis = analyzeFailure(new Error("rate limit exceeded"));
    assert.strictEqual(analysis.errorType, 'OPERATIONAL');
    assert.strictEqual(analysis.canAutoRetry, true);
  });

  test("anomalyDetection detects high failure rates", () => {
    const report = detectProviderDegradation({ provider: 'stripe', totalRequests: 100, failedRequests: 60, averageLatencyMs: 100 });
    assert.strictEqual(report.isAnomaly, true);
    assert.strictEqual(report.severity, 'HIGH');
  });

  test("explainability returns human readable reason", () => {
    const explanation = explainDecision({ action: 'Retry Payment', contextUsed: { failed_attempts: 1 }, confidence: 0.9 });
    assert.ok(explanation.why.includes('failed_attempts'));
    assert.strictEqual(explanation.confidenceLevel, 'HIGH');
  });

  test("governance stops high impact actions automatically", () => {
    const risk = evaluateActionRisk(
      { type: 'mass_refund', target: 'users', impact: 'HIGH' },
      { tenantId: 'tenant-1', allowAutomaticHighImpact: false, requireExplicitConfirmationFor: [] }
    );
    assert.strictEqual(risk.mode, 'ASSISTED');
    assert.strictEqual(risk.requiresConfirmation, true);
  });
});
