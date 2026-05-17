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
  regione: string;
  telefoni: Telefono[];
  dataUltimoOrdine?: string | null;
}

export interface Modello {
  id: string;
  nome: string;
  descrizione?: string | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [modelli, setModelli] = useState<Modello[]>([]);
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [remoteOrdiniCount, setRemoteOrdiniCount] = useState<Record<string, number>>({});

  const refreshData = useCallback(async () => {
    const [apiClienti, apiModelli, apiOrdini, apiCounts] = await Promise.all([
      gestionaleApi.fetchClienti(),
      gestionaleApi.fetchModelli(),
      gestionaleApi.fetchOrdini(),
      gestionaleApi.fetchOrdiniCountByCliente(),
    ]);

    setClienti(apiClienti ?? []);
    setModelli(apiModelli ?? []);
    setOrdini(apiOrdini ?? []);
    setRemoteOrdiniCount(apiCounts ?? {});
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

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

    if (apiResponse?.authenticated) {
      setIsAuthenticated(true);
      void refreshData();
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setClienti([]);
    setModelli([]);
    setOrdini([]);
    setRemoteOrdiniCount({});
  };

  const addCliente = (cliente: Omit<Cliente, "id">) => {
    void gestionaleApi.createCliente(cliente).then((savedCliente) => {
      if (savedCliente) {
        setClienti((current) => [...current, savedCliente]);
      }
    });
  };

  const updateCliente = (id: string, cliente: Omit<Cliente, "id">) => {
    void gestionaleApi.updateCliente(id, cliente).then((savedCliente) => {
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
    void gestionaleApi.createModello(modello).then((savedModello) => {
      if (savedModello) {
        setModelli((current) => [...current, savedModello]);
      }
    });
  };

  const updateModello = (id: string, modello: Omit<Modello, "id">) => {
    void gestionaleApi.updateModello(id, modello).then((savedModello) => {
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
