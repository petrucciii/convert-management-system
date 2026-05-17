import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AllegatoOrdine, TipoAllegato, useApp } from "../context/AppContext";

function createAttachmentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `allegato-${crypto.randomUUID()}`;
  }

  return `allegato-${Date.now()}`;
}

function inferAttachmentType(fileName: string): TipoAllegato {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("fattura")) return "fattura";
  if (lowerName.includes("ordine")) return "ordine";
  return "altro";
}

function formatFileSize(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function OrdineForm() {
  const navigate = useNavigate();
  const { id, clienteId } = useParams();
  const { addOrdine, updateOrdine, getOrdine, clienti, modelli, getCliente } = useApp();
  const isEdit = !!id;

  const [dataOrdine, setDataOrdine] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClienteId, setSelectedClienteId] = useState(clienteId || "");
  const [modelloId, setModelloId] = useState("");
  const [secondaPersonaId, setSecondaPersonaId] = useState("");
  const [allegati, setAllegati] = useState<AllegatoOrdine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      const ordine = getOrdine(id);
      if (ordine) {
        setDataOrdine(ordine.dataOrdine);
        setSelectedClienteId(ordine.clienteId);
        setModelloId(ordine.modelloId);
        setSecondaPersonaId(ordine.secondaPersonaId || "");
        setAllegati(ordine.allegati || []);
      }
    }
  }, [getOrdine, id, isEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!dataOrdine) newErrors.dataOrdine = "La data ordine e obbligatoria";
    if (!selectedClienteId) newErrors.clienteId = "Il cliente e obbligatorio";
    if (!modelloId) newErrors.modelloId = "Il modello e obbligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    // Ogni file resta visualizzabile subito; Laravel ricevera il File via FormData.
    const uploadedAttachments = files.map<AllegatoOrdine>((file) => ({
      id: createAttachmentId(),
      nome: file.name,
      tipo: inferAttachmentType(file.name),
      mimeType: file.type,
      dimensione: file.size,
      url: URL.createObjectURL(file),
      file,
    }));

    setAllegati((current) => [...current, ...uploadedAttachments]);
    event.target.value = "";
    toast.success(`${files.length} allegato/i caricato/i`);
  };

  const removeAttachment = (attachmentId: string) => {
    setAllegati((current) => {
      const attachment = current.find((item) => item.id === attachmentId);
      if (attachment?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(attachment.url);
      }

      return current.filter((item) => item.id !== attachmentId);
    });
    toast.success("Allegato rimosso");
    window.alert("Allegato eliminato con successo.");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const ordineData = {
      dataOrdine,
      clienteId: selectedClienteId,
      modelloId,
      secondaPersonaId: secondaPersonaId || undefined,
      allegati,
    };

    if (isEdit && id) {
      updateOrdine(id, ordineData);
      toast.success("Ordine aggiornato con successo");
    } else {
      addOrdine(ordineData);
      toast.success("Ordine creato con successo");
    }

    navigate(`/clienti/${clienteId || selectedClienteId}`);
  };

  const goBack = () => {
    if (clienteId) {
      navigate(`/clienti/${clienteId}`);
      return;
    }

    if (selectedClienteId) {
      navigate(`/clienti/${selectedClienteId}`);
      return;
    }

    navigate("/clienti");
  };

  const cliente = selectedClienteId ? getCliente(selectedClienteId) : null;

  return (
    <div className="p-8">
      <button
        type="button"
        onClick={goBack}
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
          {cliente
            ? `Ordine per ${cliente.nome} ${cliente.cognome}`
            : "Inserisci i dati del nuovo ordine"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni ordine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data ordine *
              </label>
              <input
                type="date"
                value={dataOrdine}
                onChange={(event) => {
                  setDataOrdine(event.target.value);
                  setErrors((current) => ({ ...current, dataOrdine: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.dataOrdine
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-slate-500"
                }`}
              />
              {errors.dataOrdine && (
                <p className="text-red-600 text-sm mt-1">{errors.dataOrdine}</p>
              )}
            </div>

            {!clienteId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente principale *
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(event) => {
                    setSelectedClienteId(event.target.value);
                    setErrors((current) => ({ ...current, clienteId: "" }));
                  }}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.clienteId
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-slate-500"
                  }`}
                >
                  <option value="">Seleziona un cliente</option>
                  {clienti.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} {item.cognome}
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
                Modello ordinato *
              </label>
              <select
                value={modelloId}
                onChange={(event) => {
                  setModelloId(event.target.value);
                  setErrors((current) => ({ ...current, modelloId: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.modelloId
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-slate-500"
                }`}
              >
                <option value="">Seleziona un modello</option>
                {modelli.map((modello) => (
                  <option key={modello.id} value={modello.id}>
                    {modello.nome || "Senza nome"}
                  </option>
                ))}
              </select>
              {errors.modelloId && (
                <p className="text-red-600 text-sm mt-1">{errors.modelloId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seconda persona associata
              </label>
              <select
                value={secondaPersonaId}
                onChange={(event) => setSecondaPersonaId(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Nessuna</option>
                {clienti
                  .filter((item) => item.id !== selectedClienteId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} {item.cognome}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Allegati</h2>
              <p className="text-sm text-gray-600">
                Carica fatture, ordini o documenti; dopo il caricamento sono apribili e scaricabili.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Carica file
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {allegati.length > 0 ? (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {allegati.map((allegato) => (
                <div
                  key={allegato.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{allegato.nome}</p>
                      <p className="text-xs text-gray-500">
                        {allegato.tipo} {formatFileSize(allegato.dimensione)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {allegato.url && (
                      <>
                        <a
                          href={allegato.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Apri
                        </a>
                        <a
                          href={allegato.url}
                          download={allegato.nome}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Download className="w-4 h-4" />
                          Scarica
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(allegato.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-md text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Rimuovi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              Nessun allegato caricato
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            {isEdit ? "Salva modifiche" : "Salva ordine"}
          </button>
        </div>
      </form>
    </div>
  );
}
