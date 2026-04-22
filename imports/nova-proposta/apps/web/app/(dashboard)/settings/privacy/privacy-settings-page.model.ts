"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { useUserPreferencesStore } from "../../../../stores/user-preferences-store";

import {
  clearStoredPrivacySession,
  executeRetentionRun,
  exportPrivacyData,
  getErrorMessage,
  loadPrivacyState,
  persistPrivacyConsents,
  persistRetentionPolicies,
  requestPrivacyAccountDeletion,
  type ConsentPurpose,
  type ConsentStatus,
  type PrivacyConsent,
  type PrivacyConsentEvent,
  type PrivacyConsentPreferences,
  type RetentionExecution,
  type RetentionPolicy,
  type RetentionRunResult
} from "./privacy-settings-page.data";

export interface PrivacySettingsModel {
  confirmation: string;
  consentHistory: PrivacyConsentEvent[];
  consentPreferences: PrivacyConsentPreferences | null;
  consents: PrivacyConsent[];
  error: string | null;
  hasSession: boolean;
  isLoading: boolean;
  isPending: boolean;
  notice: string | null;
  retentionAccessDenied: boolean;
  retentionExecutions: RetentionExecution[];
  retentionPolicies: RetentionPolicy[];
  retentionRunItems: RetentionRunResult[];
  downloadExport: () => void;
  requestDeletion: () => void;
  runRetention: (mode: "DRY_RUN" | "MANUAL") => void;
  saveConsentDecisions: () => void;
  saveRetentionSettings: () => void;
  setConfirmation: (value: string) => void;
  updateConsentStatus: (purpose: ConsentPurpose, status: ConsentStatus) => void;
  updateRetentionPolicy: (
    dataCategory: RetentionPolicy["dataCategory"],
    next: Partial<Pick<RetentionPolicy, "action" | "enabled" | "retentionDays">>
  ) => void;
}

type PrivacyStateDraft = Pick<
  PrivacySettingsModel,
  | "consentHistory"
  | "consentPreferences"
  | "consents"
  | "retentionAccessDenied"
  | "retentionExecutions"
  | "retentionPolicies"
>;

function applyPrivacyState(
  nextState: PrivacyStateDraft,
  setters: {
    setConsentHistory: (value: PrivacyConsentEvent[]) => void;
    setConsentPreferences: (value: PrivacyConsentPreferences | null) => void;
    setConsents: (value: PrivacyConsent[]) => void;
    setRetentionAccessDenied: (value: boolean) => void;
    setRetentionExecutions: (value: RetentionExecution[]) => void;
    setRetentionPolicies: (value: RetentionPolicy[]) => void;
  }
) {
  setters.setConsentHistory(nextState.consentHistory);
  setters.setConsentPreferences(nextState.consentPreferences);
  setters.setConsents(nextState.consents);
  setters.setRetentionAccessDenied(nextState.retentionAccessDenied);
  setters.setRetentionExecutions(nextState.retentionExecutions);
  setters.setRetentionPolicies(nextState.retentionPolicies);
}

export function usePrivacySettingsModel(session: object | null): PrivacySettingsModel {
  const [confirmation, setConfirmation] = useState("");
  const [consentHistory, setConsentHistory] = useState<PrivacyConsentEvent[]>([]);
  const [consentPreferences, setConsentPreferences] =
    useState<PrivacyConsentPreferences | null>(null);
  const [consents, setConsents] = useState<PrivacyConsent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [retentionAccessDenied, setRetentionAccessDenied] = useState(false);
  const [retentionExecutions, setRetentionExecutions] = useState<RetentionExecution[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [retentionRunItems, setRetentionRunItems] = useState<RetentionRunResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const hydratePreferences = useUserPreferencesStore((state) => state.hydrate);

  const setPrivacyState = useCallback(
    (nextState: PrivacyStateDraft) => {
      applyPrivacyState(nextState, {
        setConsentHistory,
        setConsentPreferences,
        setConsents,
        setRetentionAccessDenied,
        setRetentionExecutions,
        setRetentionPolicies
      });
    },
    [
      setConsentHistory,
      setConsentPreferences,
      setConsents,
      setRetentionAccessDenied,
      setRetentionExecutions,
      setRetentionPolicies
    ]
  );

  const reloadPrivacyState = useCallback(async () => {
    await hydratePreferences();
    const nextState = await loadPrivacyState();
    setPrivacyState(nextState);
  }, [hydratePreferences, setPrivacyState]);

  useEffect(() => {
    if (!session) {
      setPrivacyState({
        consentHistory: [],
        consentPreferences: null,
        consents: [],
        retentionAccessDenied: false,
        retentionExecutions: [],
        retentionPolicies: []
      });
      setRetentionRunItems([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadState = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const nextState = await loadPrivacyState();
        if (cancelled) {
          return;
        }

        setPrivacyState(nextState);
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Falha ao carregar configuracoes de privacidade."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadState();

    return () => {
      cancelled = true;
    };
  }, [session, setPrivacyState]);

  const updateConsentStatus = useCallback((purpose: ConsentPurpose, status: ConsentStatus) => {
    setConsents((current) =>
      current.map((item) =>
        item.purpose === purpose
          ? {
              ...item,
              status
            }
          : item
      )
    );
  }, []);

  const updateRetentionPolicy = useCallback(
    (
      dataCategory: RetentionPolicy["dataCategory"],
      next: Partial<Pick<RetentionPolicy, "action" | "enabled" | "retentionDays">>
    ) => {
      setRetentionPolicies((current) =>
        current.map((item) =>
          item.dataCategory === dataCategory
            ? {
                ...item,
                ...next
              }
            : item
        )
      );
    },
    []
  );

  const saveConsentDecisions = useCallback(() => {
    startTransition(() => {
      void (async () => {
        try {
          setError(null);
          setNotice("Salvando consentimentos LGPD...");

          await persistPrivacyConsents(consents);
          await reloadPrivacyState();
          setNotice("Consentimentos atualizados com sucesso.");
        } catch (requestError) {
          setError(getErrorMessage(requestError, "Falha ao salvar consentimentos."));
        }
      })();
    });
  }, [consents, reloadPrivacyState]);

  const saveRetentionSettings = useCallback(() => {
    startTransition(() => {
      void (async () => {
        try {
          setError(null);
          setNotice("Salvando politica de retencao...");

          await persistRetentionPolicies(retentionPolicies);
          await reloadPrivacyState();
          setNotice("Politica de retencao atualizada.");
        } catch (requestError) {
          setError(getErrorMessage(requestError, "Falha ao salvar politica de retencao."));
        }
      })();
    });
  }, [reloadPrivacyState, retentionPolicies]);

  const runRetention = useCallback(
    (mode: "DRY_RUN" | "MANUAL") => {
      startTransition(() => {
        void (async () => {
          try {
            setError(null);
            setNotice(
              mode === "DRY_RUN"
                ? "Executando simulacao de retencao..."
                : "Executando retencao manual..."
            );

            const items = await executeRetentionRun(mode);
            setRetentionRunItems(items);
            await reloadPrivacyState();
            setNotice(
              mode === "DRY_RUN"
                ? "Dry-run concluido. Revise os volumes antes do rollout."
                : "Retencao manual executada com sucesso."
            );
          } catch (requestError) {
            setError(getErrorMessage(requestError, "Falha ao executar retencao."));
          }
        })();
      });
    },
    [reloadPrivacyState]
  );

  const downloadExport = useCallback(() => {
    startTransition(() => {
      void (async () => {
        try {
          setError(null);
          setNotice("Gerando exportacao do tenant...");

          const exportPayload = await exportPrivacyData();
          const url = URL.createObjectURL(exportPayload.blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = exportPayload.fileName;
          link.click();
          URL.revokeObjectURL(url);
          setNotice("Exportacao concluida.");
        } catch (requestError) {
          setError(getErrorMessage(requestError, "Falha ao exportar dados."));
        }
      })();
    });
  }, []);

  const requestDeletion = useCallback(() => {
    startTransition(() => {
      void (async () => {
        try {
          setError(null);
          setNotice("Processando exclusao e anonimizacao da conta...");

          await requestPrivacyAccountDeletion(confirmation);
          clearStoredPrivacySession();
          window.location.assign("/login");
        } catch (requestError) {
          setError(getErrorMessage(requestError, "Falha ao excluir conta."));
        }
      })();
    });
  }, [confirmation]);

  return {
    confirmation,
    consentHistory,
    consentPreferences,
    consents,
    downloadExport,
    error,
    hasSession: Boolean(session),
    isLoading,
    isPending,
    notice,
    requestDeletion,
    retentionAccessDenied,
    retentionExecutions,
    retentionPolicies,
    retentionRunItems,
    runRetention,
    saveConsentDecisions,
    saveRetentionSettings,
    setConfirmation,
    updateConsentStatus,
    updateRetentionPolicy
  };
}

