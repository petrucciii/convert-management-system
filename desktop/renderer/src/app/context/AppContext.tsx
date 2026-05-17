import { createContext, useContext, useState, ReactNode } from "react";

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
  indirizzo: string;
  telefoni: Telefono[];
  dataUltimoOrdine?: string;
}

export interface Modello {
  id: string;
  nome: string;
  descrizione?: string;
  attivo: boolean;
}

export interface Ordine {
  id: string;
  clienteId: string;
  dataOrdine: string;
  modelloId: string;
  secondaPersonaId?: string;
  allegatoFattura?: string;
  allegatoOrdine?: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  clienti: Cliente[];
  addCliente: (cliente: Omit<Cliente, "id">) => void;
  updateCliente: (id: string, cliente: Omit<Cliente, "id">) => void;
  deleteCliente: (id: string) => void;
  getCliente: (id: string) => Cliente | undefined;
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

const mockClienti: Cliente[] = [
  {
    id: "1",
    nome: "Mario",
    cognome: "Rossi",
    partitaIva: "12345678901",
    codiceFiscale: "RSSMRA80A01H501U",
    dataNascita: "1980-01-01",
    indirizzo: "Via Roma 1, Milano",
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
    indirizzo: "Corso Italia 45, Roma",
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
    indirizzo: "Piazza Garibaldi 10, Torino",
    telefoni: [{ id: "t4", numero: "+39 348 5551234", principale: true }],
    dataUltimoOrdine: "2026-03-12",
  },
];

const mockModelli: Modello[] = [
  { id: "m1", nome: "Modello Alpha", descrizione: "Modello base standard", attivo: true },
  { id: "m2", nome: "Modello Beta", descrizione: "Modello premium", attivo: true },
  { id: "m3", nome: "Modello Gamma", descrizione: "Modello deluxe", attivo: true },
  { id: "m4", nome: "Modello Delta", descrizione: "Modello discontinuato", attivo: false },
];

const mockOrdini: Ordine[] = [
  {
    id: "o1",
    clienteId: "1",
    dataOrdine: "2026-05-10",
    modelloId: "m1",
    allegatoFattura: "fattura_001.pdf",
    allegatoOrdine: "ordine_001.pdf",
  },
  {
    id: "o2",
    clienteId: "1",
    dataOrdine: "2026-03-15",
    modelloId: "m2",
    secondaPersonaId: "2",
    allegatoFattura: "fattura_002.pdf",
  },
  {
    id: "o3",
    clienteId: "2",
    dataOrdine: "2026-04-25",
    modelloId: "m1",
    allegatoOrdine: "ordine_003.pdf",
  },
  {
    id: "o4",
    clienteId: "3",
    dataOrdine: "2026-03-12",
    modelloId: "m3",
    allegatoFattura: "fattura_004.pdf",
    allegatoOrdine: "ordine_004.pdf",
  },
  {
    id: "o5",
    clienteId: "1",
    dataOrdine: "2026-01-20",
    modelloId: "m2",
    allegatoFattura: "fattura_005.pdf",
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clienti, setClienti] = useState<Cliente[]>(mockClienti);
  const [modelli, setModelli] = useState<Modello[]>(mockModelli);
  const [ordini, setOrdini] = useState<Ordine[]>(mockOrdini);

  const login = (username: string, password: string) => {
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
    const newCliente = { ...cliente, id: Date.now().toString() };
    setClienti([...clienti, newCliente]);
  };

  const updateCliente = (id: string, cliente: Omit<Cliente, "id">) => {
    setClienti(clienti.map((c) => (c.id === id ? { ...cliente, id } : c)));
  };

  const deleteCliente = (id: string) => {
    setClienti(clienti.filter((c) => c.id !== id));
    setOrdini(ordini.filter((o) => o.clienteId !== id && o.secondaPersonaId !== id));
  };

  const getCliente = (id: string) => {
    return clienti.find((c) => c.id === id);
  };

  const addModello = (modello: Omit<Modello, "id">) => {
    const newModello = { ...modello, id: Date.now().toString() };
    setModelli([...modelli, newModello]);
  };

  const updateModello = (id: string, modello: Omit<Modello, "id">) => {
    setModelli(modelli.map((m) => (m.id === id ? { ...modello, id } : m)));
  };

  const deleteModello = (id: string) => {
    const isUsed = ordini.some((o) => o.modelloId === id);
    if (isUsed) {
      return false;
    }
    setModelli(modelli.filter((m) => m.id !== id));
    return true;
  };

  const getModello = (id: string) => {
    return modelli.find((m) => m.id === id);
  };

  const addOrdine = (ordine: Omit<Ordine, "id">) => {
    const newOrdine = { ...ordine, id: Date.now().toString() };
    setOrdini([...ordini, newOrdine]);

    setClienti(
      clienti.map((c) =>
        c.id === ordine.clienteId ? { ...c, dataUltimoOrdine: ordine.dataOrdine } : c
      )
    );
  };

  const updateOrdine = (id: string, ordine: Omit<Ordine, "id">) => {
    setOrdini(ordini.map((o) => (o.id === id ? { ...ordine, id } : o)));
  };

  const deleteOrdine = (id: string) => {
    setOrdini(ordini.filter((o) => o.id !== id));
  };

  const getOrdine = (id: string) => {
    return ordini.find((o) => o.id === id);
  };

  const getOrdiniByCliente = (clienteId: string) => {
    return ordini.filter((o) => o.clienteId === clienteId || o.secondaPersonaId === clienteId);
  };

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
