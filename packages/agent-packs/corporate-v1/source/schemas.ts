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
  }
};
