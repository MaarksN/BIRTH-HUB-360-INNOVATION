"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { fetchWithSession } from "../../lib/auth-client";
import { useAnalytics } from "../../providers/AnalyticsProvider";

interface FeedbackWidgetProps {
  executionId: string;
}

type FeedbackPayload = {
  expectedOutput: string | null;
  notes: string | null;
  rating: -1 | 0 | 1;
};

const initialFeedback: FeedbackPayload = {
  expectedOutput: "",
  notes: "",
  rating: 0
};

function buttonStyle(active: boolean, tone: "neutral" | "negative" | "positive"): CSSProperties {
  const color =
    tone === "positive"
      ? "rgba(15,118,110,0.12)"
      : tone === "negative"
        ? "rgba(180,35,24,0.12)"
        : "rgba(19,93,102,0.08)";

  return {
    alignItems: "center",
    background: active ? color : "rgba(255,255,255,0.88)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    cursor: "pointer",
    display: "inline-flex",
    gap: "0.45rem",
    padding: "0.65rem 0.85rem"
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizeFeedback(feedback?: FeedbackPayload | null): FeedbackPayload {
  return {
    expectedOutput: feedback?.expectedOutput ?? "",
    notes: feedback?.notes ?? "",
    rating: feedback?.rating ?? 0
  };
}

async function fetchFeedback(executionId: string): Promise<FeedbackPayload> {
  const response = await fetchWithSession(`/api/v1/executions/${encodeURIComponent(executionId)}/feedback`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar feedback (${response.status}).`);
  }

  const payload = (await response.json()) as {
    feedback?: FeedbackPayload | null;
  };

  return normalizeFeedback(payload.feedback);
}

async function submitFeedback(executionId: string, payload: FeedbackPayload): Promise<void> {
  const response = await fetchWithSession(`/api/v1/executions/${encodeURIComponent(executionId)}/feedback`, {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar feedback (${response.status}).`);
  }
}

interface CorrectiveFeedbackFormProps {
  feedback: FeedbackPayload;
  onClose: () => void;
  onExpectedOutputChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  saving: boolean;
}

function CorrectiveFeedbackForm({
  feedback,
  onClose,
  onExpectedOutputChange,
  onNotesChange,
  onSubmit,
  saving
}: Readonly<CorrectiveFeedbackFormProps>) {
  return (
    <div
      style={{
        background: "rgba(180,35,24,0.05)",
        border: "1px solid rgba(180,35,24,0.12)",
        borderRadius: 18,
        display: "grid",
        gap: "0.65rem",
        padding: "0.95rem"
      }}
    >
      <label style={{ display: "grid", gap: "0.3rem" }}>
        <span>Como o LLM deveria ter respondido?</span>
        <textarea
          onChange={(event) => onExpectedOutputChange(event.target.value)}
          placeholder="Descreva a resposta esperada para fortalecer o dataset RLHF."
          rows={5}
          style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "0.7rem" }}
          value={feedback.expectedOutput ?? ""}
        />
      </label>
      <label style={{ display: "grid", gap: "0.3rem" }}>
        <span>Observacoes adicionais</span>
        <textarea
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Ex.: alucinou numeros, errou contexto, ignorou ferramenta."
          rows={3}
          style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "0.7rem" }}
          value={feedback.notes ?? ""}
        />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
        <button
          className="action-button"
          disabled={saving}
          onClick={onSubmit}
          type="button"
        >
          Salvar feedback corretivo
        </button>
        <button
          className="ghost-button"
          disabled={saving}
          onClick={onClose}
          type="button"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export function FeedbackWidget({ executionId }: Readonly<FeedbackWidgetProps>) {
  const { track } = useAnalytics();
  const [feedback, setFeedback] = useState<FeedbackPayload>(initialFeedback);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFeedback() {
      setLoading(true);
      setError(null);

      try {
        const nextFeedback = await fetchFeedback(executionId);

        if (active) {
          setFeedback(nextFeedback);
        }
      } catch (loadError) {
        if (active) {
          setError(getErrorMessage(loadError, "Falha ao carregar feedback."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFeedback();

    return () => {
      active = false;
    };
  }, [executionId]);

  function updateFeedback(patch: Partial<FeedbackPayload>) {
    setFeedback((current) => ({
      ...current,
      ...patch
    }));
  }

  function openCorrectiveFeedback() {
    setModalOpen(true);
    updateFeedback({ rating: -1 });
  }

  async function submit(nextRating: -1 | 0 | 1) {
    setSaving(true);
    setError(null);

    const nextPayload: FeedbackPayload = {
      ...feedback,
      rating: nextRating
    };

    try {
      await submitFeedback(executionId, nextPayload);
      setFeedback(nextPayload);
      track("Agent Feedback Submitted", {
        executionId,
        rating: nextRating
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Falha ao salvar feedback."));
    } finally {
      setSaving(false);
    }
  }

  const showCorrectiveFeedback = modalOpen || feedback.rating === -1;

  return (
    <section
      style={{
        backdropFilter: "blur(14px)",
        background: "rgba(255,255,255,0.86)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        display: "grid",
        gap: "0.8rem",
        padding: "1rem"
      }}
    >
      <div>
        <strong>Avalie a resposta do agente</strong>
        <p style={{ color: "var(--muted)", margin: "0.2rem 0 0" }}>
          O voto alimenta a taxa de aprovacao do marketplace e o dataset de fine-tuning.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
        <button
          disabled={loading || saving}
          onClick={() => {
            void submit(1);
          }}
          style={buttonStyle(feedback.rating === 1, "positive")}
          type="button"
        >
          <ThumbsUp size={16} />
          Polegar para cima
        </button>
        <button
          disabled={loading || saving}
          onClick={() => {
            openCorrectiveFeedback();
          }}
          style={buttonStyle(feedback.rating === -1, "negative")}
          type="button"
        >
          <ThumbsDown size={16} />
          Polegar para baixo
        </button>
      </div>

      {showCorrectiveFeedback ? (
        <CorrectiveFeedbackForm
          feedback={feedback}
          onClose={() => {
            setModalOpen(false);
          }}
          onExpectedOutputChange={(value) => {
            updateFeedback({ expectedOutput: value });
          }}
          onNotesChange={(value) => {
            updateFeedback({ notes: value });
          }}
          onSubmit={() => {
            void submit(-1);
          }}
          saving={saving}
        />
      ) : null}

      {error ? <p style={{ color: "#9b2f2f", margin: 0 }}>{error}</p> : null}
      {loading ? <small style={{ color: "var(--muted)" }}>Carregando feedback atual...</small> : null}
    </section>
  );
}

