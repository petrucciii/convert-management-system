import type { Cliente, Modello, Ordine, PaeseDizionario, RegioneDizionario } from "../context/AppContext";

// Endpoint relativi: Laravel puo essere montato dietro lo stesso host/proxy senza hardcodare URL.
const API_PREFIX = "/api";
const AUTH_TOKEN_KEY = "convert_api_token";

type ApiCountItem = {
  clienteId?: string;
  cliente_id?: string;
  ordini?: number;
  totale?: number;
};

type ApiLoginResponse = {
  authenticated?: boolean;
  token?: string;
  user?: {
    id?: number | string | null;
    name?: string | null;
    email?: string | null;
  };
};

function getStoredToken() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setStoredToken(token: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

function clearStoredToken() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

function authHeaders() {
  const token = getStoredToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const isFormData = init?.body instanceof FormData;
    const response = await fetch(`${API_PREFIX}${path}`, {
      credentials: "include",
      ...init,
      headers: {
        Accept: "application/json",
        ...authHeaders(),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });

    if (response.status === 401) {
      clearStoredToken();
      return null;
    }

    if (response.status === 204 || response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`API ${path} ha risposto con stato ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Nessun fallback statico: se Laravel non risponde, la UI resta vuota o mostra errore.
    console.info("API Laravel non raggiungibile.", error);
    return null;
  }
}

function serializeOrderFormData(ordine: Omit<Ordine, "id">) {
  const formData = new FormData();

  formData.append("cliente_id", ordine.clienteId);
  formData.append("data_ordine", ordine.dataOrdine);
  formData.append("product_model_id", ordine.modelloId);

  if (ordine.secondaPersonaId) {
    formData.append("seconda_persona_id", ordine.secondaPersonaId);
  }

  ordine.allegati.slice(0, 3).forEach((allegato, index) => {
    if (/^\d+$/.test(allegato.id)) {
      formData.append(`allegati_meta[${index}][id]`, allegato.id);
    }
    formData.append(`allegati_meta[${index}][nome]`, allegato.nome);
    formData.append(`allegati_meta[${index}][tipo]`, allegato.tipo);

    if (allegato.file) {
      formData.append(`allegati[${index}]`, allegato.file, allegato.nome);
    }
  });

  return formData;
}

function hasFileAttachments(ordine: Omit<Ordine, "id">) {
  return ordine.allegati.some((allegato) => !!allegato.file);
}

function normalizeCountResponse(response: Record<string, number> | ApiCountItem[] | null) {
  if (!response) {
    return null;
  }

  if (!Array.isArray(response)) {
    return response;
  }

  return response.reduce<Record<string, number>>((acc, item) => {
    const clienteId = item.clienteId || item.cliente_id;
    if (clienteId) {
      acc[clienteId] = item.ordini ?? item.totale ?? 0;
    }
    return acc;
  }, {});
}

export const gestionaleApi = {
  hasAuthToken() {
    return !!getStoredToken();
  },

  setAuthToken(token: string) {
    setStoredToken(token);
  },

  clearAuthToken() {
    clearStoredToken();
  },

  login(username: string, password: string) {
    return apiRequest<ApiLoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  me() {
    return apiRequest<ApiLoginResponse>("/me");
  },

  logout() {
    return apiRequest("/logout", { method: "POST" }).finally(clearStoredToken);
  },

  fetchClienti() {
    return apiRequest<Cliente[]>("/clienti");
  },

  createCliente(cliente: Omit<Cliente, "id">) {
    return apiRequest<Cliente>("/clienti", {
      method: "POST",
      body: JSON.stringify(cliente),
    });
  },

  updateCliente(id: string, cliente: Omit<Cliente, "id">) {
    return apiRequest<Cliente>(`/clienti/${id}`, {
      method: "PUT",
      body: JSON.stringify(cliente),
    });
  },

  deleteCliente(id: string) {
    return apiRequest(`/clienti/${id}`, { method: "DELETE" });
  },

  fetchModelli() {
    return apiRequest<Modello[]>("/modelli");
  },

  createModello(modello: Omit<Modello, "id">) {
    return apiRequest<Modello>("/modelli", {
      method: "POST",
      body: JSON.stringify(modello),
    });
  },

  updateModello(id: string, modello: Omit<Modello, "id">) {
    return apiRequest<Modello>(`/modelli/${id}`, {
      method: "PUT",
      body: JSON.stringify(modello),
    });
  },

  deleteModello(id: string) {
    return apiRequest(`/modelli/${id}`, { method: "DELETE" });
  },

  fetchRegions() {
    return apiRequest<RegioneDizionario[]>("/regions");
  },

  createRegion(regione: Omit<RegioneDizionario, "id">) {
    return apiRequest<RegioneDizionario>("/regions", {
      method: "POST",
      body: JSON.stringify(regione),
    });
  },

  updateRegion(id: string, regione: Omit<RegioneDizionario, "id">) {
    return apiRequest<RegioneDizionario>(`/regions/${id}`, {
      method: "PUT",
      body: JSON.stringify(regione),
    });
  },

  deleteRegion(id: string) {
    return apiRequest(`/regions/${id}`, { method: "DELETE" });
  },

  fetchTowns() {
    return apiRequest<PaeseDizionario[]>("/towns");
  },

  createTown(paese: Omit<PaeseDizionario, "id">) {
    return apiRequest<PaeseDizionario>("/towns", {
      method: "POST",
      body: JSON.stringify(paese),
    });
  },

  updateTown(id: string, paese: Omit<PaeseDizionario, "id">) {
    return apiRequest<PaeseDizionario>(`/towns/${id}`, {
      method: "PUT",
      body: JSON.stringify(paese),
    });
  },

  deleteTown(id: string) {
    return apiRequest(`/towns/${id}`, { method: "DELETE" });
  },

  fetchOrdini() {
    return apiRequest<Ordine[]>("/ordini");
  },

  async fetchOrdiniCountByCliente() {
    const response = await apiRequest<Record<string, number> | ApiCountItem[]>(
      "/clienti/ordini-count"
    );
    return normalizeCountResponse(response);
  },

  createOrdine(ordine: Omit<Ordine, "id">) {
    return apiRequest<Ordine>("/ordini", {
      method: "POST",
      body: hasFileAttachments(ordine) ? serializeOrderFormData(ordine) : JSON.stringify(ordine),
    });
  },

  updateOrdine(id: string, ordine: Omit<Ordine, "id">) {
    if (hasFileAttachments(ordine)) {
      const formData = serializeOrderFormData(ordine);
      formData.append("_method", "PUT");

      return apiRequest<Ordine>(`/ordini/${id}`, {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<Ordine>(`/ordini/${id}`, {
      method: "PUT",
      body: JSON.stringify(ordine),
    });
  },

  deleteOrdine(id: string) {
    return apiRequest(`/ordini/${id}`, { method: "DELETE" });
  },
};
