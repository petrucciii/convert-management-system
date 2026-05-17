import type { Cliente, Modello, Ordine } from "../context/AppContext";

// Endpoint relativi: Laravel puo essere montato dietro lo stesso host/proxy senza hardcodare URL.
const API_PREFIX = "/api";

type ApiCountItem = {
  clienteId?: string;
  cliente_id?: string;
  ordini?: number;
  totale?: number;
};

type ApiLoginResponse = {
  authenticated?: boolean;
  token?: string;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const isFormData = init?.body instanceof FormData;
    const response = await fetch(`${API_PREFIX}${path}`, {
      credentials: "include",
      ...init,
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });

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
    // L'app continua con i dati locali finche il backend Laravel non e collegato.
    console.info("API Laravel non raggiungibile, uso stato locale.", error);
    return null;
  }
}

function serializeOrderFormData(ordine: Omit<Ordine, "id">) {
  const formData = new FormData();

  formData.append("cliente_id", ordine.clienteId);
  formData.append("data_ordine", ordine.dataOrdine);
  formData.append("modello_id", ordine.modelloId);

  if (ordine.secondaPersonaId) {
    formData.append("seconda_persona_id", ordine.secondaPersonaId);
  }

  ordine.allegati.forEach((allegato, index) => {
    formData.append(`allegati_meta[${index}][id]`, allegato.id);
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
  login(username: string, password: string) {
    return apiRequest<ApiLoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
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
    return apiRequest<Ordine>(`/ordini/${id}`, {
      method: "PUT",
      body: hasFileAttachments(ordine) ? serializeOrderFormData(ordine) : JSON.stringify(ordine),
    });
  },

  deleteOrdine(id: string) {
    return apiRequest(`/ordini/${id}`, { method: "DELETE" });
  },
};
