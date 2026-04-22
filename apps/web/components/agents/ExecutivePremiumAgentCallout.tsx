import Link from "next/link";

import {
  buildExecutivePremiumAgentHref,
  EXECUTIVE_PREMIUM_COLLECTION_HREF,
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT
} from "../../lib/executive-premium";

export function ExecutivePremiumAgentCallout(props: {
  agentId: string;
  description: string;
  title: string;
}) {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,58,138,0.92))",
        border: "1px solid rgba(148, 163, 184, 0.24)",
        borderRadius: 18,
        color: "#f8fafc",
        display: "grid",
        gap: "0.75rem",
        padding: "1rem"
      }}
    >
      <div style={{ display: "grid", gap: "0.3rem" }}>
        <small style={{ letterSpacing: "0.08em", opacity: 0.8, textTransform: "uppercase" }}>
          Executive Premium
        </small>
        <strong style={{ fontSize: "1.05rem" }}>{props.title}</strong>
        <p style={{ color: "rgba(248,250,252,0.86)", margin: 0 }}>{props.description}</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        <span
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "0.35rem 0.75rem"
          }}
        >
          {EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "0.35rem 0.75rem"
          }}
        >
          Governanca reforcada
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "0.35rem 0.75rem"
          }}
        >
          Handoff executivo
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        <Link href={buildExecutivePremiumAgentHref(props.agentId)} style={{ color: "#f8fafc" }}>
          Abrir agente na colecao premium
        </Link>
        <Link href={EXECUTIVE_PREMIUM_COLLECTION_HREF} style={{ color: "#bfdbfe" }}>
          Ver colecao completa
        </Link>
        <Link href="/sales-os" style={{ color: "#bfdbfe" }}>
          Abrir Sales OS
        </Link>
      </div>
    </section>
  );
}
