import { getWebConfig } from "../../../lib/web-config";
import Link from "next/link";

import { ProductEmptyState, ProductPageHeader } from "../../../components/dashboard/page-fragments";
import { fetchOutputDetail, fetchOutputs } from "../../../lib/marketplace-api.server";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export default async function ReportsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<SearchParams>;
}>) {
  const config = getWebConfig();
  const resolvedParams = (await searchParams) ?? {};
  const typeFilter = readParam(resolvedParams.type);
  const executionId = readParam(resolvedParams.executionId);
  const outputId = readParam(resolvedParams.outputId);

  const data = await fetchOutputs({
    ...(executionId ? { executionId } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  }).catch(() => ({ outputs: [] }));
  const selectedOutput = outputId ? await fetchOutputDetail(outputId).catch(() => null) : null;

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <a href={`${config.NEXT_PUBLIC_API_URL}/api/v1/analytics/billing/export`}>
              Exportar billing CSV
            </a>
            <Link className="ghost-button" href="/outputs">
              Abrir outputs legacy
            </Link>
          </div>
        }
        badge="Reports & Export"
        description="Centralizar artefatos exportaveis, validacao de hash e links de download em uma unica jornada."
        title="Reports com integridade verificavel"
      />

      <form className="panel" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <input
          defaultValue={typeFilter}
          name="type"
          placeholder="technical-log ou executive-report"
          type="text"
        />
        <button className="action-button" type="submit">
          Filtrar
        </button>
      </form>

      {data.outputs.length === 0 ? (
        <ProductEmptyState
          description="Nenhum report foi gerado ainda para o filtro atual."
          title="Sem reports disponiveis"
        />
      ) : (
        <section className="panel">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Output ID</th>
                  <th>Agent</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Hash</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data.outputs.map((output) => (
                  <tr key={output.id}>
                    <td>{output.id}</td>
                    <td>{output.agentId}</td>
                    <td>{output.type}</td>
                    <td>{output.status}</td>
                    <td>
                      <code>{output.outputHash.slice(0, 16)}...</code>
                    </td>
                    <td>
                      <div className="hero-actions">
                        <Link
                          href={`/reports?type=${encodeURIComponent(typeFilter)}${executionId ? `&executionId=${encodeURIComponent(executionId)}` : ""}&outputId=${encodeURIComponent(output.id)}`}
                        >
                          Detalhes
                        </Link>
                        <a
                          className="ghost-button"
                          href={`${config.NEXT_PUBLIC_API_URL}/api/v1/outputs/${output.id}/export`}
                        >
                          Exportar
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedOutput ? (
        <section className="panel">
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.85rem",
            }}
          >
            <div>
              <h2>Detalhe do report</h2>
              <small style={{ color: "var(--muted)" }}>{selectedOutput.output.id}</small>
            </div>
            <span className={selectedOutput.integrity.isValid ? "status-green" : "status-red"}>
              {selectedOutput.integrity.isValid ? "Hash valido" : "Hash divergente"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gap: "0.85rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <strong>Hash esperado</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>{selectedOutput.integrity.expectedHash}</pre>
            </div>
            <div>
              <strong>Hash recalculado</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {selectedOutput.integrity.recalculatedHash}
              </pre>
            </div>
          </div>

          <div>
            <strong>Conteudo exportado</strong>
            <pre
              style={{
                background: "rgba(255,255,255,0.4)",
                borderRadius: 18,
                marginBottom: 0,
                overflowX: "auto",
                padding: "1rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedOutput.output.content}
            </pre>
          </div>
        </section>
      ) : null}
    </main>
  );
}
