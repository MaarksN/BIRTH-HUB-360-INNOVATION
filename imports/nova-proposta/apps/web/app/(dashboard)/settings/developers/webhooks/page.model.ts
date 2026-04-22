"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createWebhookEndpoint,
  defaultTopics,
  fetchWebhookDeliveries,
  fetchWebhookEndpoints,
  getErrorMessage,
  parseTopics,
  prependEndpoint,
  replaceEndpoint,
  resolveSelectedEndpointId,
  retryWebhookDelivery,
  type WebhookDelivery,
  type WebhookEndpoint,
  updateWebhookEndpointStatus
} from "./page.data";

export interface DeveloperWebhooksModel {
  deliveries: WebhookDelivery[];
  endpoints: WebhookEndpoint[];
  error: string | null;
  loading: boolean;
  saving: boolean;
  selectedId: string | null;
  topics: string;
  url: string;
  createEndpoint: () => Promise<void>;
  reloadEndpoints: () => Promise<void>;
  retryDelivery: (delivery: WebhookDelivery) => Promise<void>;
  selectEndpoint: (endpointId: string | null) => void;
  setTopics: (value: string) => void;
  setUrl: (value: string) => void;
  toggleEndpointStatus: (endpoint: WebhookEndpoint) => Promise<void>;
}

export function useDeveloperWebhooksModel(hasSession: boolean): DeveloperWebhooksModel {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [topics, setTopics] = useState(defaultTopics);
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEndpoints = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await fetchWebhookEndpoints();

      setEndpoints(items);
      setSelectedId((current) => resolveSelectedEndpointId(current, items));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Falha ao carregar endpoints."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeliveries = useCallback(async (endpointId: string) => {
    setError(null);

    try {
      setDeliveries(await fetchWebhookDeliveries(endpointId));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Falha ao carregar entregas."));
    }
  }, []);

  const createEndpoint = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const endpoint = await createWebhookEndpoint(url, parseTopics(topics));
      setUrl("");
      setTopics(defaultTopics);
      setEndpoints((current) => prependEndpoint(current, endpoint));
      setSelectedId(endpoint.id);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Falha ao criar endpoint."));
    } finally {
      setSaving(false);
    }
  }, [topics, url]);

  const toggleEndpointStatus = useCallback(async (endpoint: WebhookEndpoint) => {
    setError(null);

    try {
      const status = endpoint.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
      const updatedEndpoint = await updateWebhookEndpointStatus(endpoint.id, status);

      setEndpoints((current) => replaceEndpoint(current, updatedEndpoint));
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Falha ao atualizar endpoint."));
    }
  }, []);

  const retryDelivery = useCallback(
    async (delivery: WebhookDelivery) => {
      setError(null);

      try {
        await retryWebhookDelivery(delivery.id);
        await loadDeliveries(delivery.endpointId);
      } catch (retryError) {
        setError(getErrorMessage(retryError, "Falha ao reenviar delivery."));
      }
    },
    [loadDeliveries]
  );

  useEffect(() => {
    if (!hasSession) {
      setEndpoints([]);
      setDeliveries([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    void loadEndpoints();
  }, [hasSession, loadEndpoints]);

  useEffect(() => {
    if (!selectedId) {
      setDeliveries([]);
      return;
    }

    void loadDeliveries(selectedId);
  }, [loadDeliveries, selectedId]);

  return {
    createEndpoint,
    deliveries,
    endpoints,
    error,
    loading,
    reloadEndpoints: loadEndpoints,
    retryDelivery,
    saving,
    selectEndpoint: setSelectedId,
    selectedId,
    setTopics,
    setUrl,
    toggleEndpointStatus,
    topics,
    url
  };
}

