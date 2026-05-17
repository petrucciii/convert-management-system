import type { Cliente, Modello, PaeseDizionario, RegioneDizionario, Telefono } from "../context/AppContext";

function compactSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function capitalizeToken(token: string) {
  const chars = Array.from(token);
  const letterIndex = chars.findIndex((char) => /\p{L}/u.test(char));

  if (letterIndex === -1) {
    return token;
  }

  chars[letterIndex] = chars[letterIndex].toLocaleUpperCase("it-IT");
  return chars.join("");
}

export function titleCaseWords(value: string) {
  const normalized = compactSpaces(value).toLocaleLowerCase("it-IT");

  return normalized
    .split(" ")
    .map((word) => word.split("-").map(capitalizeToken).join("-"))
    .join(" ");
}

export function upperText(value: string) {
  return compactSpaces(value).toLocaleUpperCase("it-IT");
}

export function trimText(value: string) {
  return compactSpaces(value);
}

export function normalizePhones(telefoni: Telefono[]) {
  return telefoni
    .map((telefono) => ({
      ...telefono,
      numero: trimText(telefono.numero || ""),
      label: telefono.label ? titleCaseWords(telefono.label) : telefono.label,
    }))
    .filter((telefono) => telefono.numero || telefono.label);
}

export function normalizeClienteInput<T extends Omit<Cliente, "id"> | Cliente>(cliente: T): T {
  return {
    ...cliente,
    nome: titleCaseWords(cliente.nome || ""),
    cognome: titleCaseWords(cliente.cognome || ""),
    partitaIva: upperText(cliente.partitaIva || ""),
    codiceFiscale: upperText(cliente.codiceFiscale || ""),
    via: titleCaseWords(cliente.via || ""),
    paese: titleCaseWords(cliente.paese || ""),
    provincia: upperText(cliente.provincia || ""),
    cap: upperText(cliente.cap || ""),
    regione: upperText(cliente.regione || ""),
    telefoni: normalizePhones(cliente.telefoni || []),
  };
}

export function normalizeModelloInput<T extends Omit<Modello, "id"> | Modello>(modello: T): T {
  return {
    ...modello,
    nome: upperText(modello.nome || ""),
    descrizione: modello.descrizione ? upperText(modello.descrizione) : modello.descrizione,
  };
}

export function normalizeRegioneInput<T extends Omit<RegioneDizionario, "id"> | RegioneDizionario>(
  regione: T
): T {
  return {
    ...regione,
    name: upperText(regione.name || ""),
    description: regione.description ? trimText(regione.description) : regione.description,
  };
}

export function normalizePaeseInput<T extends Omit<PaeseDizionario, "id"> | PaeseDizionario>(
  paese: T
): T {
  return {
    ...paese,
    name: titleCaseWords(paese.name || ""),
    province: upperText(paese.province || ""),
    postal_code: upperText(paese.postal_code || ""),
    description: paese.description ? trimText(paese.description) : paese.description,
  };
}
