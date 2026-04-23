/**
 * BirthHub 360 Corporate-v1 Standard Schemas
 * This file defines strict JSON Schemas for the priority corporate agents.
 */

export interface AgentSchemaMap {
  [agentId: string]: {
    skills: {
      [skillId: string]: {
        input: any;
        output: any;
      };
    };
    tools: {
      [toolId: string]: {
        input: any;
        output: any;
      };
    };
  };
}

export const CORPORATE_SCHEMAS: AgentSchemaMap = {
  "ceo-pack": {
    skills: {
      "strategic-planning": {
        input: {
          type: "object",
          properties: {
            objectives: { type: "array", items: { type: "string" } },
            time_horizon: { type: "string", enum: ["quarterly", "yearly", "multi-year"] },
            constraints: { type: "array", items: { type: "string" } }
          },
          required: ["objectives"]
        },
        output: {
          type: "object",
          properties: {
            roadmap: { type: "array", items: { type: "object" } },
            allocation: { type: "object" },
            risks: { type: "array", items: { type: "string" } }
          }
        }
      },
      "executive-decisioning": {
        input: {
          type: "object",
          properties: {
            options: { type: "array", items: { type: "object" } },
            criteria: { type: "array", items: { type: "string" } }
          },
          required: ["options"]
        },
        output: {
          type: "object",
          properties: {
            selected_option: { type: "string" },
            rationale: { type: "string" },
            trade_offs: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    tools: {
      "board-report-generator": {
        input: {
          type: "object",
          properties: {
            sections: { type: "array", items: { type: "string" } },
            data_points: { type: "object" }
          }
        },
        output: {
          type: "object",
          properties: {
            report_url: { type: "string" },
            summary: { type: "string" }
          }
        }
      }
    }
  },
  "cfo-pack": {
    skills: {
      "cash-flow-analysis": {
        input: {
          type: "object",
          properties: {
            period: { type: "string" },
            inflows: { type: "array", items: { type: "number" } },
            outflows: { type: "array", items: { type: "number" } }
          }
        },
        output: {
          type: "object",
          properties: {
            net_cash_flow: { type: "number" },
            runway_months: { type: "number" },
            critical_points: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    tools: {
      "budget-service": {
        input: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["check", "allocate", "reallocate"] },
            amount: { type: "number" },
            department: { type: "string" }
          }
        },
        output: {
          type: "object",
          properties: {
            approved: { type: "boolean" },
            remaining_budget: { type: "number" }
          }
        }
      }
    }
  },
  "cro-pack": {
    skills: {
      "revenue-acceleration": {
        input: {
          type: "object",
          properties: {
            pipeline_data: { type: "object" },
            growth_targets: { type: "object" }
          }
        },
        output: {
          type: "object",
          properties: {
            forecast: { type: "number" },
            velocity_score: { type: "number" },
            bottlenecks: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    tools: {}
  },
  "sales-pack": {
    skills: {
      "lead-qualification": {
        input: {
          type: "object",
          properties: {
            lead_data: { type: "object" },
            framework: { type: "string", enum: ["BANT", "MEDDIC", "CHAMP"] }
          }
        },
        output: {
          type: "object",
          properties: {
            qualified: { type: "boolean" },
            score: { type: "number" },
            justification: { type: "string" }
          }
        }
      },
      "deal-coaching": {
        input: {
          type: "object",
          properties: {
            deal_stage: { type: "string" },
            objections: { type: "array", items: { type: "string" } }
          }
        },
        output: {
          type: "object",
          properties: {
            recommended_actions: { type: "array", items: { type: "string" } },
            closing_probability: { type: "number" }
          }
        }
      }
    },
    tools: {}
  },
  "cs-pack": {
    skills: {
      "health-scoring": {
        input: {
          type: "object",
          properties: {
            usage_metrics: { type: "object" },
            sentiment_score: { type: "number" }
          }
        },
        output: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            churn_risk: { type: "string", enum: ["low", "medium", "high"] },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    tools: {}
  },
  "ops-pack": {
    skills: {
      "incident-triage": {
        input: {
          type: "object",
          properties: {
            alert_data: { type: "object" },
            severity: { type: "string", enum: ["p0", "p1", "p2", "p3"] }
          }
        },
        output: {
          type: "object",
          properties: {
            priority: { type: "number" },
            owner: { type: "string" },
            runbook_steps: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    tools: {}
  },
  "agent-mesh-orchestrator-pack": {
    skills: {
      "select-specialists": {
        input: {
          type: "object",
          properties: {
            request_type: { type: "string" },
            context_summary: { type: "string" }
          }
        },
        output: {
          type: "object",
          properties: {
            specialists: { type: "array", items: { type: "string" } },
            handoff_order: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    tools: {}
  }
};
