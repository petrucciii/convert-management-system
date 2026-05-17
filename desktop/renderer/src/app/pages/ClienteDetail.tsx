import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Download, Edit, ExternalLink, FileText, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { Cliente, Telefono, useApp } from "../context/AppContext";

export function ClienteDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    getCliente,
    updateCliente,
    deleteCliente,
    getOrdiniByCliente,
    deleteOrdine,
    getModello,
  } = useApp();
  const [activeTab, setActiveTab] = useState("anagrafica");
  const [draftCliente, setDraftCliente] = useState<Cliente | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteClienteOpen, setDeleteClienteOpen] = useState(false);
  const [deleteOrdineId, setDeleteOrdineId] = useState<string | null>(null);

  const cliente = id ? getCliente(id) : undefined;
  const ordini = id ? getOrdiniByCliente(id) : [];

  useEffect(() => {
    if (cliente) {
      // La scheda anagrafica e gia un form: l'utente modifica e salva dal bottone centrale.
      setDraftCliente({
        ...cliente,
        telefoni: cliente.telefoni.map((telefono) => ({ ...telefono })),
      });
    }
  }, [cliente]);

  if (!cliente || !draftCliente) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Cliente non trovato</p>
      </div>
    );
  }

  const updateDraftField = (field: keyof Cliente, value: string) => {
    setDraftCliente((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const updateTelefono = (telefonoId: string, numero: string) => {
    setDraftCliente((current) =>
      current
        ? {
            ...current,
            telefoni: current.telefoni.map((telefono) =>
              telefono.id === telefonoId ? { ...telefono, numero } : telefono
            ),
          }
        : current
    );
  };

  const addTelefono = () => {
    setDraftCliente((current) =>
      current
        ? {
            ...current,
            telefoni: [
              ...current.telefoni,
              { id: Date.now().toString(), numero: "", principale: false },
            ],
          }
        : current
    );
  };

  const removeTelefono = (telefonoId: string) => {
    setDraftCliente((current) => {
      if (!current || current.telefoni.length === 1) {
        toast.error("Deve esserci almeno un telefono");
        return current;
      }

      const removed = current.telefoni.find((telefono) => telefono.id === telefonoId);
      const nextTelefoni = current.telefoni.filter((telefono) => telefono.id !== telefonoId);
      if (removed?.principale && nextTelefoni.length > 0) {
        nextTelefoni[0].principale = true;
      }

      return { ...current, telefoni: nextTelefoni };
    });
  };

  const setPrincipale = (telefonoId: string) => {
    setDraftCliente((current) =>
      current
        ? {
            ...current,
            telefoni: current.telefoni.map((telefono) => ({
              ...telefono,
              principale: telefono.id === telefonoId,
            })),
          }
        : current
    );
  };

  const validateDraft = () => {
    const newErrors: Record<string, string> = {};

    if (!draftCliente.nome.trim()) newErrors.nome = "Il nome e obbligatorio";
    if (!draftCliente.cognome.trim()) newErrors.cognome = "Il cognome e obbligatorio";
    if (!draftCliente.partitaIva.trim()) newErrors.partitaIva = "La partita IVA e obbligatoria";
    if (!draftCliente.codiceFiscale.trim()) {
      newErrors.codiceFiscale = "Il codice fiscale e obbligatorio";
    }
    if (!draftCliente.dataNascita) newErrors.dataNascita = "La data di nascita e obbligatoria";
    if (!draftCliente.via.trim()) newErrors.via = "La via e obbligatoria";
    if (!draftCliente.paese.trim()) newErrors.paese = "Il paese e obbligatorio";
    if (!draftCliente.regione.trim()) newErrors.regione = "La regione e obbligatoria";

    draftCliente.telefoni.forEach((telefono, index) => {
      if (!telefono.numero.trim()) {
        newErrors[`telefono-${index}`] = "Il numero e obbligatorio";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCliente = () => {
    if (!validateDraft()) {
      toast.error("Controlla i campi obbligatori");
      return;
    }

    const { id: clienteId, ...clienteData } = draftCliente;
    updateCliente(clienteId, clienteData);
    toast.success("Anagrafica aggiornata");
  };

  const handleDeleteCliente = () => {
    if (id) {
      deleteCliente(id);
      toast.success("Cliente eliminato con successo");
      window.alert("Cliente eliminato con successo.");
      navigate("/clienti");
    }
  };

  const handleDeleteOrdine = (ordineId: string) => {
    deleteOrdine(ordineId);
    toast.success("Ordine eliminato con successo");
    window.alert("Ordine eliminato con successo.");
    setDeleteOrdineId(null);
  };

  const inputClass = (name: string) =>
    `w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
      errors[name] ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-slate-500"
    }`;

  const renderTelefono = (telefono: Telefono, index: number) => (
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
      {draftCliente.telefoni.length > 1 && (
        <button
          type="button"
          onClick={() => removeTelefono(telefono.id)}
          className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/clienti")}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Torna ai clienti
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                {cliente.nome} {cliente.cognome}
              </h1>
              <p className="text-gray-600 mt-1">
                {cliente.paese} - {cliente.regione}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/clienti/${id}/ordini/nuovo`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Aggiungi ordine
              </button>
              <button
                type="button"
                onClick={() => setDeleteClienteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-md hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Elimina cliente
              </button>
            </div>
          </div>
        </div>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex border-b border-gray-200 px-6">
            <Tabs.Trigger
              value="anagrafica"
              className={`px-4 py-3 -mb-px border-b-2 transition-colors ${
                activeTab === "anagrafica"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Anagrafica
            </Tabs.Trigger>
            <Tabs.Trigger
              value="ordini"
              className={`px-4 py-3 -mb-px border-b-2 transition-colors ${
                activeTab === "ordini"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Ordini ({ordini.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="anagrafica" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Dati personali</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input
                      type="text"
                      value={draftCliente.nome}
                      onChange={(event) => updateDraftField("nome", event.target.value)}
                      className={inputClass("nome")}
                    />
                    {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      value={draftCliente.cognome}
                      onChange={(event) => updateDraftField("cognome", event.target.value)}
                      className={inputClass("cognome")}
                    />
                    {errors.cognome && (
                      <p className="text-red-600 text-sm mt-1">{errors.cognome}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data di nascita *
                    </label>
                    <input
                      type="date"
                      value={draftCliente.dataNascita}
                      onChange={(event) => updateDraftField("dataNascita", event.target.value)}
                      className={inputClass("dataNascita")}
                    />
                    {errors.dataNascita && (
                      <p className="text-red-600 text-sm mt-1">{errors.dataNascita}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Dati fiscali</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Partita IVA *
                    </label>
                    <input
                      type="text"
                      value={draftCliente.partitaIva}
                      onChange={(event) => updateDraftField("partitaIva", event.target.value)}
                      className={inputClass("partitaIva")}
                    />
                    {errors.partitaIva && (
                      <p className="text-red-600 text-sm mt-1">{errors.partitaIva}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Codice fiscale *
                    </label>
                    <input
                      type="text"
                      value={draftCliente.codiceFiscale}
                      onChange={(event) => updateDraftField("codiceFiscale", event.target.value)}
                      className={inputClass("codiceFiscale")}
                    />
                    {errors.codiceFiscale && (
                      <p className="text-red-600 text-sm mt-1">{errors.codiceFiscale}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Indirizzo</h2>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Via *</label>
                    <input
                      type="text"
                      value={draftCliente.via}
                      onChange={(event) => updateDraftField("via", event.target.value)}
                      className={inputClass("via")}
                    />
                    {errors.via && <p className="text-red-600 text-sm mt-1">{errors.via}</p>}
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paese *</label>
                    <input
                      type="text"
                      value={draftCliente.paese}
                      onChange={(event) => updateDraftField("paese", event.target.value)}
                      className={inputClass("paese")}
                    />
                    {errors.paese && (
                      <p className="text-red-600 text-sm mt-1">{errors.paese}</p>
                    )}
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Regione *
                    </label>
                    <input
                      type="text"
                      value={draftCliente.regione}
                      onChange={(event) => updateDraftField("regione", event.target.value)}
                      className={inputClass("regione")}
                    />
                    {errors.regione && (
                      <p className="text-red-600 text-sm mt-1">{errors.regione}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
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
                  {draftCliente.telefoni.map((telefono, index) => renderTelefono(telefono, index))}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                type="button"
                onClick={handleSaveCliente}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Salva modifiche
              </button>
            </div>
          </Tabs.Content>

          <Tabs.Content value="ordini" className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Data ordine
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Modello
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Seconda persona
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Allegati
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordini.map((ordine) => {
                    const modello = getModello(ordine.modelloId);
                    const secondaPersona = ordine.secondaPersonaId
                      ? getCliente(ordine.secondaPersonaId)
                      : null;

                    return (
                      <tr key={ordine.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {format(new Date(ordine.dataOrdine), "dd/MM/yyyy")}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {modello?.nome || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {secondaPersona
                            ? `${secondaPersona.nome} ${secondaPersona.cognome}`
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-2">
                            {ordine.allegati.length > 0 ? (
                              ordine.allegati.map((allegato) => (
                                <div
                                  key={allegato.id}
                                  className="flex flex-wrap items-center gap-2 text-sm"
                                >
                                  <span className="inline-flex items-center gap-1 text-gray-800">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    {allegato.nome}
                                  </span>
                                  {allegato.url && (
                                    <>
                                      <a
                                        href={allegato.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Apri
                                      </a>
                                      <a
                                        href={allegato.url}
                                        download={allegato.nome}
                                        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Scarica
                                      </a>
                                    </>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">Nessuno</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/ordini/${ordine.id}/modifica`)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              title="Modifica ordine"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteOrdineId(ordine.id)}
                              className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Elimina ordine"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {ordini.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500">Nessun ordine disponibile</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/clienti/${id}/ordini/nuovo`)}
                    className="mt-4 text-gray-900 hover:text-gray-700 font-medium"
                  >
                    Aggiungi il primo ordine
                  </button>
                </div>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <AlertDialog.Root open={deleteClienteOpen} onOpenChange={setDeleteClienteOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione cliente
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo cliente? Anche gli ordini associati verranno
              eliminati.
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Annulla
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDeleteCliente}
                  className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
                >
                  Elimina
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={deleteOrdineId !== null}
        onOpenChange={(open) => !open && setDeleteOrdineId(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione ordine
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo ordine?
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Annulla
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={() => deleteOrdineId && handleDeleteOrdine(deleteOrdineId)}
                  className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
                >
                  Elimina
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
