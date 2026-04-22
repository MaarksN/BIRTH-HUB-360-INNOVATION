import React from "react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main
      style={{
        alignItems: "center",
        display: "grid",
        minHeight: "100vh",
        padding: "2rem"
      }}
    >
      <section
        style={{
          background: "var(--surface, #ffffff)",
          border: "1px solid rgba(30, 58, 138, 0.12)",
          borderRadius: "1.5rem",
          boxShadow: "0 24px 80px rgba(30, 58, 138, 0.08)",
          margin: "0 auto",
          maxWidth: "36rem",
          padding: "2rem"
        }}
      >
        <p
          style={{
            color: "var(--muted, #5c6b73)",
            fontSize: "0.875rem",
            letterSpacing: "0.08em",
            margin: "0 0 0.75rem",
            textTransform: "uppercase"
          }}
        >
          Modo offline
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.05, margin: "0 0 1rem" }}>
          A conexão caiu, mas o BirthHub continua disponível para recuperação rápida.
        </h1>
        <p
          style={{
            color: "var(--muted, #5c6b73)",
            fontSize: "1rem",
            lineHeight: 1.7,
            margin: "0 0 1.5rem"
          }}
        >
          Mantivemos os assets essenciais e esta rota de contingência em cache. Assim que a internet voltar,
          recarregue a aplicação para restaurar dados em tempo real.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link
            href="/"
            style={{
              background: "#135d66",
              borderRadius: "999px",
              color: "#f7f3ea",
              padding: "0.85rem 1.4rem",
              textDecoration: "none"
            }}
          >
            Tentar novamente
          </Link>
          <Link
            href="/health"
            style={{
              border: "1px solid rgba(30, 58, 138, 0.2)",
              borderRadius: "999px",
              color: "#135d66",
              padding: "0.85rem 1.4rem",
              textDecoration: "none"
            }}
          >
            Ver healthcheck
          </Link>
        </div>
      </section>
    </main>
  );
}

