import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useApp } from "../context/AppContext";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

export function OrdineForm() {
  const navigate = useNavigate();
  const { id, clienteId } = useParams();
  const { addOrdine, updateOrdine, getOrdine, clienti, modelli, getCliente } = useApp();
  const isEdit = !!id;

  const [dataOrdine, setDataOrdine] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedClienteId, setSelectedClienteId] = useState(clienteId || "");
  const [modelloId, setModelloId] = useState("");
  const [secondaPersonaId, setSecondaPersonaId] = useState("");
  const [allegatoFattura, setAllegatoFattura] = useState("");
  const [allegatoOrdine, setAllegatoOrdine] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      const ordine = getOrdine(id);
      if (ordine) {
        setDataOrdine(ordine.dataOrdine);
        setSelectedClienteId(ordine.clienteId);
        setModelloId(ordine.modelloId);
        setSecondaPersonaId(ordine.secondaPersonaId || "");
        setAllegatoFattura(ordine.allegatoFattura || "");
        setAllegatoOrdine(ordine.allegatoOrdine || "");
      }
    }
  }, [id, isEdit, getOrdine]);

  const activeModelli = modelli.filter((m) => m.attivo);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!dataOrdine) newErrors.dataOrdine = "La data ordine è obbligatoria";
    if (!selectedClienteId) newErrors.clienteId = "Il cliente è obbligatorio";
    if (!modelloId) newErrors.modelloId = "Il modello è obbligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const ordineData = {
      dataOrdine,
      clienteId: selectedClienteId,
      modelloId,
      secondaPersonaId: secondaPersonaId || undefined,
      allegatoFattura: allegatoFattura || undefined,
      allegatoOrdine: allegatoOrdine || undefined,
    };

    if (isEdit && id) {
      updateOrdine(id, ordineData);
      toast.success("Ordine aggiornato con successo");
    } else {
      addOrdine(ordineData);
      toast.success("Ordine creato con successo");
    }

    if (clienteId) {
      navigate(`/clienti/${clienteId}`);
    } else {
      navigate(`/clienti/${selectedClienteId}`);
    }
  };

  const cliente = selectedClienteId ? getCliente(selectedClienteId) : null;

  return (
    <div className="p-8">
      <button
        onClick={() => {
          if (clienteId) {
            navigate(`/clienti/${clienteId}`);
          } else if (selectedClienteId) {
            navigate(`/clienti/${selectedClienteId}`);
          } else {
            navigate("/clienti");
          }
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Torna indietro
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          {isEdit ? "Modifica ordine" : "Aggiungi ordine"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit
            ? "Modifica le informazioni dell'ordine"
            : cliente
            ? `Crea un nuovo ordine per ${cliente.nome} ${cliente.cognome}`
            : "Inserisci i dati del nuovo ordine"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni ordine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data ordine <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={dataOrdine}
                onChange={(e) => {
                  setDataOrdine(e.target.value);
                  setErrors((prev) => ({ ...prev, dataOrdine: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.dataOrdine
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.dataOrdine && (
                <p className="text-red-600 text-sm mt-1">{errors.dataOrdine}</p>
              )}
            </div>

            {!clienteId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente principale <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => {
                    setSelectedClienteId(e.target.value);
                    setErrors((prev) => ({ ...prev, clienteId: "" }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.clienteId
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                >
                  <option value="">Seleziona un cliente</option>
                  {clienti.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cognome}
                    </option>
                  ))}
                </select>
                {errors.clienteId && (
                  <p className="text-red-600 text-sm mt-1">{errors.clienteId}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modello ordinato <span className="text-red-600">*</span>
              </label>
              <select
                value={modelloId}
                onChange={(e) => {
                  setModelloId(e.target.value);
                  setErrors((prev) => ({ ...prev, modelloId: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.modelloId
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">Seleziona un modello</option>
                {activeModelli.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
              {errors.modelloId && (
                <p className="text-red-600 text-sm mt-1">{errors.modelloId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seconda persona associata (opzionale)
              </label>
              <select
                value={secondaPersonaId}
                onChange={(e) => setSecondaPersonaId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nessuna</option>
                {clienti
                  .filter((c) => c.id !== selectedClienteId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cognome}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Allegati</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allegato fattura (opzionale)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={allegatoFattura}
                  onChange={(e) => setAllegatoFattura(e.target.value)}
                  placeholder="es. fattura_001.pdf"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {allegatoFattura && (
                  <div className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Caricato</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allegato ordine (opzionale)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={allegatoOrdine}
                  onChange={(e) => setAllegatoOrdine(e.target.value)}
                  placeholder="es. ordine_001.pdf"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {allegatoOrdine && (
                  <div className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Caricato</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            In questa demo, inserisci il nome del file. In produzione, qui ci sarebbe un upload
            vero.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              if (clienteId) {
                navigate(`/clienti/${clienteId}`);
              } else if (selectedClienteId) {
                navigate(`/clienti/${selectedClienteId}`);
              } else {
                navigate("/clienti");
              }
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEdit ? "Salva modifiche" : "Salva ordine"}
          </button>
        </div>
      </form>
    </div>
  );
}
