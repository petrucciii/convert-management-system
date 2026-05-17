import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Telefono, useApp } from "../context/AppContext";

export function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addCliente, updateCliente, getCliente } = useApp();
  const isEdit = !!id;

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [partitaIva, setPartitaIva] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [dataNascita, setDataNascita] = useState("");
  const [via, setVia] = useState("");
  const [paese, setPaese] = useState("");
  const [provincia, setProvincia] = useState("");
  const [cap, setCap] = useState("");
  const [regione, setRegione] = useState("");
  const [telefoni, setTelefoni] = useState<Telefono[]>([
    { id: "1", numero: "", principale: true },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      const cliente = getCliente(id);
      if (cliente) {
        setNome(cliente.nome);
        setCognome(cliente.cognome);
        setPartitaIva(cliente.partitaIva);
        setCodiceFiscale(cliente.codiceFiscale);
        setDataNascita(cliente.dataNascita);
        setVia(cliente.via);
        setPaese(cliente.paese);
        setProvincia(cliente.provincia);
        setCap(cliente.cap);
        setRegione(cliente.regione);
        setTelefoni(cliente.telefoni);
      }
    }
  }, [getCliente, id, isEdit]);

  const addTelefono = () => {
    setTelefoni((current) => [
      ...current,
      { id: Date.now().toString(), numero: "", principale: false },
    ]);
  };

  const removeTelefono = (telefonoId: string) => {
    const removed = telefoni.find((telefono) => telefono.id === telefonoId);
    const nextTelefoni = telefoni.filter((telefono) => telefono.id !== telefonoId);
    if (removed?.principale && nextTelefoni.length > 0) {
      nextTelefoni[0].principale = true;
    }
    setTelefoni(nextTelefoni);
  };

  const updateTelefono = (telefonoId: string, numero: string) => {
    setTelefoni((current) =>
      current.map((telefono) =>
        telefono.id === telefonoId ? { ...telefono, numero } : telefono
      )
    );
  };

  const setPrincipale = (telefonoId: string) => {
    setTelefoni((current) =>
      current.map((telefono) => ({ ...telefono, principale: telefono.id === telefonoId }))
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (dataNascita && new Date(dataNascita).getTime() > Date.now()) {
      newErrors.dataNascita = "La data di nascita non puo essere futura";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("Controlla i dati inseriti");
      return;
    }

    const clienteData = {
      nome,
      cognome,
      partitaIva,
      codiceFiscale,
      dataNascita,
      via,
      paese,
      provincia,
      cap,
      regione,
      telefoni,
      dataUltimoOrdine: isEdit && id ? getCliente(id)?.dataUltimoOrdine : undefined,
    };

    if (isEdit && id) {
      updateCliente(id, clienteData);
      toast.success("Cliente aggiornato con successo");
    } else {
      addCliente(clienteData);
      toast.success("Cliente creato con successo");
    }

    navigate("/clienti");
  };

  const inputClass = (name: string) =>
    `w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
      errors[name] ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-slate-500"
    }`;

  return (
    <div className="p-8">
      <button
        type="button"
        onClick={() => navigate("/clienti")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Torna ai clienti
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          {isEdit ? "Modifica cliente" : "Aggiungi cliente"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? "Aggiorna i dati anagrafici" : "Inserisci una nuova anagrafica"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati anagrafici</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(event) => {
                  setNome(event.target.value);
                  setErrors((current) => ({ ...current, nome: "" }));
                }}
                className={inputClass("nome")}
              />
              {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cognome</label>
              <input
                type="text"
                value={cognome}
                onChange={(event) => {
                  setCognome(event.target.value);
                  setErrors((current) => ({ ...current, cognome: "" }));
                }}
                className={inputClass("cognome")}
              />
              {errors.cognome && <p className="text-red-600 text-sm mt-1">{errors.cognome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data di nascita
              </label>
              <input
                type="date"
                value={dataNascita}
                onChange={(event) => {
                  setDataNascita(event.target.value);
                  setErrors((current) => ({ ...current, dataNascita: "" }));
                }}
                className={inputClass("dataNascita")}
              />
              {errors.dataNascita && (
                <p className="text-red-600 text-sm mt-1">{errors.dataNascita}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati fiscali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partita IVA</label>
              <input
                type="text"
                value={partitaIva}
                onChange={(event) => {
                  setPartitaIva(event.target.value);
                  setErrors((current) => ({ ...current, partitaIva: "" }));
                }}
                className={inputClass("partitaIva")}
              />
              {errors.partitaIva && (
                <p className="text-red-600 text-sm mt-1">{errors.partitaIva}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice fiscale
              </label>
              <input
                type="text"
                value={codiceFiscale}
                onChange={(event) => {
                  setCodiceFiscale(event.target.value);
                  setErrors((current) => ({ ...current, codiceFiscale: "" }));
                }}
                className={inputClass("codiceFiscale")}
              />
              {errors.codiceFiscale && (
                <p className="text-red-600 text-sm mt-1">{errors.codiceFiscale}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Via</label>
              <input
                type="text"
                value={via}
                onChange={(event) => {
                  setVia(event.target.value);
                  setErrors((current) => ({ ...current, via: "" }));
                }}
                className={inputClass("via")}
              />
              {errors.via && <p className="text-red-600 text-sm mt-1">{errors.via}</p>}
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Paese</label>
              <input
                type="text"
                value={paese}
                onChange={(event) => {
                  setPaese(event.target.value);
                  setErrors((current) => ({ ...current, paese: "" }));
                }}
                className={inputClass("paese")}
              />
              {errors.paese && <p className="text-red-600 text-sm mt-1">{errors.paese}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
              <input
                type="text"
                value={provincia}
                onChange={(event) => {
                  setProvincia(event.target.value);
                  setErrors((current) => ({ ...current, provincia: "" }));
                }}
                className={inputClass("provincia")}
              />
              {errors.provincia && (
                <p className="text-red-600 text-sm mt-1">{errors.provincia}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">CAP</label>
              <input
                type="text"
                value={cap}
                onChange={(event) => {
                  setCap(event.target.value);
                  setErrors((current) => ({ ...current, cap: "" }));
                }}
                className={inputClass("cap")}
              />
              {errors.cap && <p className="text-red-600 text-sm mt-1">{errors.cap}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Regione</label>
              <input
                type="text"
                value={regione}
                onChange={(event) => {
                  setRegione(event.target.value);
                  setErrors((current) => ({ ...current, regione: "" }));
                }}
                className={inputClass("regione")}
              />
              {errors.regione && <p className="text-red-600 text-sm mt-1">{errors.regione}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Contatti</h2>
            <button
              type="button"
              onClick={addTelefono}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Aggiungi telefono
            </button>
          </div>

          <div className="space-y-3">
            {telefoni.map((telefono, index) => (
              <div key={telefono.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="tel"
                    value={telefono.numero}
                    onChange={(event) => {
                      updateTelefono(telefono.id, event.target.value);
                      setErrors((current) => ({ ...current, [`telefono-${index}`]: "" }));
                    }}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors[`telefono-${index}`]
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-slate-500"
                    }`}
                    placeholder="Numero di telefono"
                  />
                  {errors[`telefono-${index}`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`telefono-${index}`]}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={telefono.principale}
                    onChange={() => setPrincipale(telefono.id)}
                    className="w-4 h-4 accent-slate-900"
                  />
                  Principale
                </label>
                {telefoni.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeTelefono(telefono.id)}
                    className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/clienti")}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            {isEdit ? "Salva modifiche" : "Crea cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
