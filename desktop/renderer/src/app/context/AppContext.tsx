import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { gestionaleApi } from "../services/api";
import {
  normalizeClienteInput,
  normalizeModelloInput,
  normalizePaeseInput,
  normalizeRegioneInput,
} from "../utils/textFormat";

export interface Telefono {
  id: string;
  numero: string;
  principale: boolean;
  label?: string | null;
}

export interface Cliente {
  id: string;
  nome: string;
  cognome: string;
  partitaIva: string;
  codiceFiscale: string;
  dataNascita: string;
  via: string;
  paese: string;
  provincia: string;
  cap: string;
  regione: string;
  telefoni: Telefono[];
  dataUltimoOrdine?: string | null;
}

export interface Modello {
  id: string;
  nome: string;
  descrizione?: string | null;
}

export interface RegioneDizionario {
  id: string;
  name: string;
  description?: string | null;
}

export interface PaeseDizionario {
  id: string;
  region_id?: string | null;
  name: string;
  province?: string | null;
  postal_code?: string | null;
  description?: string | null;
  region?: RegioneDizionario | null;
}

export type TipoAllegato = "fattura" | "ordine" | "altro";

export interface AllegatoOrdine {
  id: string;
  nome: string;
  tipo: TipoAllegato;
  mimeType?: string | null;
  dimensione?: number | null;
  url?: string | null;
  file?: File;
}

export interface Ordine {
  id: string;
  clienteId: string;
  dataOrdine: string;
  modelloId: string;
  secondaPersonaId?: string | null;
  allegati: AllegatoOrdine[];
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clienti: Cliente[];
  addCliente: (cliente: Omit<Cliente, "id">) => void;
  updateCliente: (id: string, cliente: Omit<Cliente, "id">) => void;
  deleteCliente: (id: string) => void;
  getCliente: (id: string) => Cliente | undefined;
  getNumeroOrdiniCliente: (clienteId: string) => number;
  modelli: Modello[];
  addModello: (modello: Omit<Modello, "id">) => void;
  updateModello: (id: string, modello: Omit<Modello, "id">) => void;
  deleteModello: (id: string) => boolean;
  getModello: (id: string) => Modello | undefined;
  regioni: RegioneDizionario[];
  addRegione: (regione: Omit<RegioneDizionario, "id">) => void;
  updateRegione: (id: string, regione: Omit<RegioneDizionario, "id">) => void;
  deleteRegione: (id: string) => void;
  getRegione: (id: string) => RegioneDizionario | undefined;
  paesi: PaeseDizionario[];
  addPaese: (paese: Omit<PaeseDizionario, "id">) => void;
  updatePaese: (id: string, paese: Omit<PaeseDizionario, "id">) => void;
  deletePaese: (id: string) => void;
  getPaese: (id: string) => PaeseDizionario | undefined;
  ordini: Ordine[];
  addOrdine: (ordine: Omit<Ordine, "id">) => void;
  updateOrdine: (id: string, ordine: Omit<Ordine, "id">) => void;
  deleteOrdine: (id: string) => void;
  getOrdine: (id: string) => Ordine | undefined;
  getOrdiniByCliente: (clienteId: string) => Ordine[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function latestOrderDate(clienteId: string, orders: Ordine[]) {
  const timestamps = orders
    .filter((ordine) => ordine.clienteId === clienteId || ordine.secondaPersonaId === clienteId)
    .map((ordine) => new Date(ordine.dataOrdine).getTime())
    .filter((timestamp) => !Number.isNaN(timestamp));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString().split("T")[0];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => gestionaleApi.hasAuthToken());
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [modelli, setModelli] = useState<Modello[]>([]);
  const [regioni, setRegioni] = useState<RegioneDizionario[]>([]);
  const [paesi, setPaesi] = useState<PaeseDizionario[]>([]);
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [remoteOrdiniCount, setRemoteOrdiniCount] = useState<Record<string, number>>({});

  const resetData = useCallback(() => {
    setClienti([]);
    setModelli([]);
    setRegioni([]);
    setPaesi([]);
    setOrdini([]);
    setRemoteOrdiniCount({});
  }, []);

  const refreshData = useCallback(async () => {
    const [apiClienti, apiModelli, apiRegioni, apiPaesi, apiOrdini, apiCounts] = await Promise.all([
      gestionaleApi.fetchClienti(),
      gestionaleApi.fetchModelli(),
      gestionaleApi.fetchRegions(),
      gestionaleApi.fetchTowns(),
      gestionaleApi.fetchOrdini(),
      gestionaleApi.fetchOrdiniCountByCliente(),
    ]);

    if (!gestionaleApi.hasAuthToken()) {
      setIsAuthenticated(false);
      resetData();
      return;
    }

    setClienti(apiClienti ?? []);
    setModelli(apiModelli ?? []);
    setRegioni(apiRegioni ?? []);
    setPaesi(apiPaesi ?? []);
    setOrdini(apiOrdini ?? []);
    setRemoteOrdiniCount(apiCounts ?? {});
  }, [resetData]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void refreshData();
  }, [isAuthenticated, refreshData]);

  useEffect(() => {
    if (!gestionaleApi.hasAuthToken()) {
      return;
    }

    void gestionaleApi.me().then((response) => {
      if (!response?.authenticated) {
        gestionaleApi.clearAuthToken();
        setIsAuthenticated(false);
        resetData();
      }
    });
  }, [resetData]);

  const localOrdiniCount = useMemo(() => {
    return ordini.reduce<Record<string, number>>((acc, ordine) => {
      if (ordine.clienteId) {
        acc[ordine.clienteId] = (acc[ordine.clienteId] || 0) + 1;
      }
      if (ordine.secondaPersonaId) {
        acc[ordine.secondaPersonaId] = (acc[ordine.secondaPersonaId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [ordini]);

  const login = async (username: string, password: string) => {
    const apiResponse = await gestionaleApi.login(username, password);

    if (apiResponse?.authenticated && apiResponse.token) {
      gestionaleApi.setAuthToken(apiResponse.token);
      setIsAuthenticated(true);
      await refreshData();
      return true;
    }

    return false;
  };

  const logout = () => {
    void gestionaleApi.logout();
    setIsAuthenticated(false);
    resetData();
  };

  const addCliente = (cliente: Omit<Cliente, "id">) => {
    const normalizedCliente = normalizeClienteInput(cliente);

    void gestionaleApi.createCliente(normalizedCliente).then((savedCliente) => {
      if (savedCliente) {
        setClienti((current) => [...current, savedCliente]);
      }
    });
  };

  const updateCliente = (id: string, cliente: Omit<Cliente, "id">) => {
    const normalizedCliente = normalizeClienteInput(cliente);

    void gestionaleApi.updateCliente(id, normalizedCliente).then((savedCliente) => {
      if (savedCliente) {
        setClienti((current) => current.map((item) => (item.id === id ? savedCliente : item)));
      }
    });
  };

  const deleteCliente = (id: string) => {
    setClienti((current) => current.filter((cliente) => cliente.id !== id));
    setOrdini((current) =>
      current.filter((ordine) => ordine.clienteId !== id && ordine.secondaPersonaId !== id)
    );
    setRemoteOrdiniCount({});

    void gestionaleApi.deleteCliente(id);
  };

  const getCliente = useCallback(
    (id: string) => clienti.find((cliente) => cliente.id === id),
    [clienti]
  );

  const getNumeroOrdiniCliente = useCallback(
    (clienteId: string) => remoteOrdiniCount[clienteId] ?? localOrdiniCount[clienteId] ?? 0,
    [localOrdiniCount, remoteOrdiniCount]
  );

  const addModello = (modello: Omit<Modello, "id">) => {
    const normalizedModello = normalizeModelloInput(modello);

    void gestionaleApi.createModello(normalizedModello).then((savedModello) => {
      if (savedModello) {
        setModelli((current) => [...current, savedModello]);
      }
    });
  };

  const updateModello = (id: string, modello: Omit<Modello, "id">) => {
    const normalizedModello = normalizeModelloInput(modello);

    void gestionaleApi.updateModello(id, normalizedModello).then((savedModello) => {
      if (savedModello) {
        setModelli((current) => current.map((item) => (item.id === id ? savedModello : item)));
      }
    });
  };

  const deleteModello = (id: string) => {
    const isUsed = ordini.some((ordine) => ordine.modelloId === id);
    if (isUsed) {
      return false;
    }

    setModelli((current) => current.filter((modello) => modello.id !== id));
    void gestionaleApi.deleteModello(id);
    return true;
  };

  const getModello = useCallback(
    (id: string) => modelli.find((modello) => modello.id === id),
    [modelli]
  );

  const addRegione = (regione: Omit<RegioneDizionario, "id">) => {
    const normalizedRegione = normalizeRegioneInput(regione);

    void gestionaleApi.createRegion(normalizedRegione).then((savedRegione) => {
      if (savedRegione) {
        setRegioni((current) => [...current, savedRegione]);
      }
    });
  };

  const updateRegione = (id: string, regione: Omit<RegioneDizionario, "id">) => {
    const normalizedRegione = normalizeRegioneInput(regione);

    void gestionaleApi.updateRegion(id, normalizedRegione).then((savedRegione) => {
      if (savedRegione) {
        setRegioni((current) => current.map((item) => (item.id === id ? savedRegione : item)));
      }
    });
  };

  const deleteRegione = (id: string) => {
    setRegioni((current) => current.filter((regione) => regione.id !== id));
    setPaesi((current) =>
      current.map((paese) =>
        paese.region_id === id ? { ...paese, region_id: null, region: null } : paese
      )
    );
    void gestionaleApi.deleteRegion(id);
  };

  const getRegione = useCallback(
    (id: string) => regioni.find((regione) => regione.id === id),
    [regioni]
  );

  const addPaese = (paese: Omit<PaeseDizionario, "id">) => {
    const normalizedPaese = normalizePaeseInput(paese);

    void gestionaleApi.createTown(normalizedPaese).then((savedPaese) => {
      if (savedPaese) {
        setPaesi((current) => [...current, savedPaese]);
      }
    });
  };

  const updatePaese = (id: string, paese: Omit<PaeseDizionario, "id">) => {
    const normalizedPaese = normalizePaeseInput(paese);

    void gestionaleApi.updateTown(id, normalizedPaese).then((savedPaese) => {
      if (savedPaese) {
        setPaesi((current) => current.map((item) => (item.id === id ? savedPaese : item)));
      }
    });
  };

  const deletePaese = (id: string) => {
    setPaesi((current) => current.filter((paese) => paese.id !== id));
    void gestionaleApi.deleteTown(id);
  };

  const getPaese = useCallback(
    (id: string) => paesi.find((paese) => paese.id === id),
    [paesi]
  );

  const addOrdine = (ordine: Omit<Ordine, "id">) => {
    void gestionaleApi.createOrdine(ordine).then((savedOrdine) => {
      if (savedOrdine) {
        setOrdini((current) => [...current, savedOrdine]);
        setRemoteOrdiniCount({});
        void refreshData();
      }
    });
  };

  const updateOrdine = (id: string, ordine: Omit<Ordine, "id">) => {
    void gestionaleApi.updateOrdine(id, ordine).then((savedOrdine) => {
      if (savedOrdine) {
        setOrdini((current) => current.map((item) => (item.id === id ? savedOrdine : item)));
        setRemoteOrdiniCount({});
        void refreshData();
      }
    });
  };

  const deleteOrdine = (id: string) => {
    setOrdini((current) => {
      const nextOrdini = current.filter((ordine) => ordine.id !== id);

      setClienti((currentClienti) =>
        currentClienti.map((cliente) => ({
          ...cliente,
          dataUltimoOrdine: latestOrderDate(cliente.id, nextOrdini),
        }))
      );

      return nextOrdini;
    });
    setRemoteOrdiniCount({});

    void gestionaleApi.deleteOrdine(id);
  };

  const getOrdine = useCallback((id: string) => ordini.find((ordine) => ordine.id === id), [ordini]);

  const getOrdiniByCliente = useCallback(
    (clienteId: string) =>
      ordini.filter(
        (ordine) => ordine.clienteId === clienteId || ordine.secondaPersonaId === clienteId
      ),
    [ordini]
  );

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        clienti,
        addCliente,
        updateCliente,
        deleteCliente,
        getCliente,
        getNumeroOrdiniCliente,
        modelli,
        addModello,
        updateModello,
        deleteModello,
        getModello,
        regioni,
        addRegione,
        updateRegione,
        deleteRegione,
        getRegione,
        paesi,
        addPaese,
        updatePaese,
        deletePaese,
        getPaese,
        ordini,
        addOrdine,
        updateOrdine,
        deleteOrdine,
        getOrdine,
        getOrdiniByCliente,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
