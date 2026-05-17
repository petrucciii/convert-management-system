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
  dataUltimoOrdine?: string;
}

export interface Modello {
  id: string;
  nome: string;
  descrizione?: string;
}

export type TipoAllegato = "fattura" | "ordine" | "altro";

export interface AllegatoOrdine {
  id: string;
  nome: string;
  tipo: TipoAllegato;
  mimeType?: string;
  dimensione?: number;
  url?: string;
  file?: File;
}

export interface Ordine {
  id: string;
  clienteId: string;
  dataOrdine: string;
  modelloId: string;
  secondaPersonaId?: string;
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

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function makeDemoAttachment(id: string, nome: string, tipo: TipoAllegato): AllegatoOrdine {
  const body = encodeURIComponent(`Documento demo: ${nome}`);

  return {
    id,
    nome,
    tipo,
    mimeType: "text/plain",
    dimensione: body.length,
    url: `data:text/plain;charset=utf-8,${body}`,
  };
}

function getLatestOrderDate(clienteId: string, orders: Ordine[]) {
  const timestamps = orders
    .filter((ordine) => ordine.clienteId === clienteId || ordine.secondaPersonaId === clienteId)
    .map((ordine) => new Date(ordine.dataOrdine).getTime());

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...timestamps)).toISOString().split("T")[0];
}

const mockClienti: Cliente[] = [
  {
    id: "1",
    nome: "Mario",
    cognome: "Rossi",
    partitaIva: "12345678901",
    codiceFiscale: "RSSMRA80A01H501U",
    dataNascita: "1980-01-01",
    via: "Via Roma 1",
    paese: "Milano",
    provincia: "MI",
    cap: "20121",
    regione: "Lombardia",
    telefoni: [
      { id: "t1", numero: "+39 333 1234567", principale: true },
      { id: "t2", numero: "+39 02 12345678", principale: false },
    ],
    dataUltimoOrdine: "2026-05-10",
  },
  {
    id: "2",
    nome: "Laura",
    cognome: "Bianchi",
    partitaIva: "98765432109",
    codiceFiscale: "BNCLRA85B41F205X",
    dataNascita: "1985-02-01",
    via: "Corso Italia 45",
    paese: "Roma",
    provincia: "RM",
    cap: "00198",
    regione: "Lazio",
    telefoni: [{ id: "t3", numero: "+39 340 9876543", principale: true }],
    dataUltimoOrdine: "2026-04-25",
  },
  {
    id: "3",
    nome: "Giuseppe",
    cognome: "Verdi",
    partitaIva: "11223344556",
    codiceFiscale: "VRDGPP75C15L219P",
    dataNascita: "1975-03-15",
    via: "Piazza Garibaldi 10",
    paese: "Torino",
    provincia: "TO",
    cap: "10122",
    regione: "Piemonte",
    telefoni: [{ id: "t4", numero: "+39 348 5551234", principale: true }],
    dataUltimoOrdine: "2026-03-12",
  },
];

const mockModelli: Modello[] = [
  { id: "m1", nome: "Modello Alpha", descrizione: "Modello base standard" },
  { id: "m2", nome: "Modello Beta", descrizione: "Modello premium" },
  { id: "m3", nome: "Modello Gamma", descrizione: "Modello deluxe" },
  { id: "m4", nome: "Modello Delta", descrizione: "Modello storico" },
];

const mockOrdini: Ordine[] = [
  {
    id: "o1",
    clienteId: "1",
    dataOrdine: "2026-05-10",
    modelloId: "m1",
    allegati: [
      makeDemoAttachment("a1", "fattura_001.pdf", "fattura"),
      makeDemoAttachment("a2", "ordine_001.pdf", "ordine"),
    ],
  },
  {
    id: "o2",
    clienteId: "1",
    dataOrdine: "2026-03-15",
    modelloId: "m2",
    secondaPersonaId: "2",
    allegati: [makeDemoAttachment("a3", "fattura_002.pdf", "fattura")],
  },
  {
    id: "o3",
    clienteId: "2",
    dataOrdine: "2026-04-25",
    modelloId: "m1",
    allegati: [makeDemoAttachment("a4", "ordine_003.pdf", "ordine")],
  },
  {
    id: "o4",
    clienteId: "3",
    dataOrdine: "2026-03-12",
    modelloId: "m3",
    allegati: [
      makeDemoAttachment("a5", "fattura_004.pdf", "fattura"),
      makeDemoAttachment("a6", "ordine_004.pdf", "ordine"),
    ],
  },
  {
    id: "o5",
    clienteId: "1",
    dataOrdine: "2026-01-20",
    modelloId: "m2",
    allegati: [makeDemoAttachment("a7", "fattura_005.pdf", "fattura")],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clienti, setClienti] = useState<Cliente[]>(mockClienti);
  const [modelli, setModelli] = useState<Modello[]>(mockModelli);
  const [ordini, setOrdini] = useState<Ordine[]>(mockOrdini);
  const [remoteOrdiniCount, setRemoteOrdiniCount] = useState<Record<string, number>>({});

  // Caricamento AJAX iniziale: quando Laravel risponde, sostituisce i dati mock.
  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      gestionaleApi.fetchClienti(),
      gestionaleApi.fetchModelli(),
      gestionaleApi.fetchOrdini(),
      gestionaleApi.fetchOrdiniCountByCliente(),
    ]).then(([apiClienti, apiModelli, apiOrdini, apiCounts]) => {
      if (!isMounted) {
        return;
      }

      if (apiClienti) setClienti(apiClienti);
      if (apiModelli) setModelli(apiModelli);
      if (apiOrdini) setOrdini(apiOrdini);
      if (apiCounts) setRemoteOrdiniCount(apiCounts);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const localOrdiniCount = useMemo(() => {
    return ordini.reduce<Record<string, number>>((acc, ordine) => {
      acc[ordine.clienteId] = (acc[ordine.clienteId] || 0) + 1;
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
      return true;
    }

    // Fallback locale utile finche non e collegato il backend Laravel.
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const addCliente = (cliente: Omit<Cliente, "id">) => {
    const tempCliente = { ...cliente, id: createId("cliente") };
    setClienti((current) => [...current, tempCliente]);

    void gestionaleApi.createCliente(cliente).then((savedCliente) => {
      if (savedCliente) {
        setClienti((current) =>
          current.map((item) => (item.id === tempCliente.id ? savedCliente : item))
        );
      }
    });
  };

  const updateCliente = (id: string, cliente: Omit<Cliente, "id">) => {
    setClienti((current) => current.map((item) => (item.id === id ? { ...cliente, id } : item)));

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
    (id: string) => {
      return clienti.find((cliente) => cliente.id === id);
    },
    [clienti]
  );

  const getNumeroOrdiniCliente = useCallback(
    (clienteId: string) => {
      return remoteOrdiniCount[clienteId] ?? localOrdiniCount[clienteId] ?? 0;
    },
    [localOrdiniCount, remoteOrdiniCount]
  );

  const addModello = (modello: Omit<Modello, "id">) => {
    const tempModello = { ...modello, id: createId("modello") };
    setModelli((current) => [...current, tempModello]);

    void gestionaleApi.createModello(modello).then((savedModello) => {
      if (savedModello) {
        setModelli((current) =>
          current.map((item) => (item.id === tempModello.id ? savedModello : item))
        );
      }
    });
  };

  const updateModello = (id: string, modello: Omit<Modello, "id">) => {
    setModelli((current) => current.map((item) => (item.id === id ? { ...modello, id } : item)));

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
    (id: string) => {
      return modelli.find((modello) => modello.id === id);
    },
    [modelli]
  );

  const addOrdine = (ordine: Omit<Ordine, "id">) => {
    const tempOrdine = { ...ordine, id: createId("ordine") };
    setOrdini((current) => [...current, tempOrdine]);
    setRemoteOrdiniCount({});

    setClienti((current) =>
      current.map((cliente) =>
        cliente.id === ordine.clienteId
          ? { ...cliente, dataUltimoOrdine: ordine.dataOrdine }
          : cliente
      )
    );

    void gestionaleApi.createOrdine(ordine).then((savedOrdine) => {
      if (savedOrdine) {
        setOrdini((current) =>
          current.map((item) => (item.id === tempOrdine.id ? savedOrdine : item))
        );
      }
    });
  };

  const updateOrdine = (id: string, ordine: Omit<Ordine, "id">) => {
    setOrdini((current) => current.map((item) => (item.id === id ? { ...ordine, id } : item)));
    setRemoteOrdiniCount({});

    setClienti((current) =>
      current.map((cliente) =>
        cliente.id === ordine.clienteId
          ? { ...cliente, dataUltimoOrdine: ordine.dataOrdine }
          : cliente
      )
    );

    void gestionaleApi.updateOrdine(id, ordine).then((savedOrdine) => {
      if (savedOrdine) {
        setOrdini((current) => current.map((item) => (item.id === id ? savedOrdine : item)));
      }
    });
  };

  const deleteOrdine = (id: string) => {
    setOrdini((current) => {
      const nextOrdini = current.filter((ordine) => ordine.id !== id);

      setClienti((currentClienti) =>
        currentClienti.map((cliente) => ({
          ...cliente,
          dataUltimoOrdine: getLatestOrderDate(cliente.id, nextOrdini),
        }))
      );

      return nextOrdini;
    });
    setRemoteOrdiniCount({});

    void gestionaleApi.deleteOrdine(id);
  };

  const getOrdine = useCallback(
    (id: string) => {
      return ordini.find((ordine) => ordine.id === id);
    },
    [ordini]
  );

  const getOrdiniByCliente = useCallback(
    (clienteId: string) => {
      return ordini.filter(
        (ordine) => ordine.clienteId === clienteId || ordine.secondaPersonaId === clienteId
      );
    },
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
