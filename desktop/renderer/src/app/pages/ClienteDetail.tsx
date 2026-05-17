import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useApp } from "../context/AppContext";
import { ArrowLeft, Edit, Trash2, Plus, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Tabs from "@radix-ui/react-tabs";

export function ClienteDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getCliente, deleteCliente, getOrdiniByCliente, deleteOrdine, getModello } = useApp();
  const [activeTab, setActiveTab] = useState("anagrafica");
  const [deleteClienteOpen, setDeleteClienteOpen] = useState(false);
  const [deleteOrdineId, setDeleteOrdineId] = useState<string | null>(null);

  const cliente = id ? getCliente(id) : undefined;
  const ordini = id ? getOrdiniByCliente(id) : [];

  if (!cliente) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Cliente non trovato</p>
      </div>
    );
  }

  const handleDeleteCliente = () => {
    if (id) {
      deleteCliente(id);
      toast.success("Cliente eliminato con successo");
      navigate("/clienti");
    }
  };

  const handleDeleteOrdine = (ordineId: string) => {
    deleteOrdine(ordineId);
    toast.success("Ordine eliminato con successo");
    setDeleteOrdineId(null);
  };

  return (
    <div className="p-8">
      <button
        onClick={() => navigate("/clienti")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Torna ai clienti
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                {cliente.nome} {cliente.cognome}
              </h1>
              <p className="text-gray-600 mt-1">Dettagli cliente</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/clienti/${id}/ordini/nuovo`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Aggiungi ordine
              </button>
              <button
                onClick={() => navigate(`/clienti/${id}/modifica`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Modifica cliente
              </button>
              <button
                onClick={() => setDeleteClienteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Anagrafica
            </Tabs.Trigger>
            <Tabs.Trigger
              value="ordini"
              className={`px-4 py-3 -mb-px border-b-2 transition-colors ${
                activeTab === "ordini"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Ordini ({ordini.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="anagrafica" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nome</p>
                  <p className="text-gray-900 font-medium">{cliente.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cognome</p>
                  <p className="text-gray-900 font-medium">{cliente.cognome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Data di nascita</p>
                  <p className="text-gray-900 font-medium">
                    {format(new Date(cliente.dataNascita), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Partita IVA</p>
                  <p className="text-gray-900 font-medium">{cliente.partitaIva}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Codice Fiscale</p>
                  <p className="text-gray-900 font-medium">{cliente.codiceFiscale}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Indirizzo</p>
                  <p className="text-gray-900 font-medium">{cliente.indirizzo}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">Telefoni</p>
                <div className="space-y-2">
                  {cliente.telefoni.map((telefono) => (
                    <div
                      key={telefono.id}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="text-gray-900 font-medium">{telefono.numero}</p>
                      {telefono.principale && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          Principale
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="ordini" className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
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
                          <div className="flex gap-2">
                            {ordine.allegatoFattura && (
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                title={ordine.allegatoFattura}
                              >
                                <FileText className="w-4 h-4" />
                                Fattura
                              </button>
                            )}
                            {ordine.allegatoOrdine && (
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 bg-green-50 rounded hover:bg-green-100"
                                title={ordine.allegatoOrdine}
                              >
                                <FileText className="w-4 h-4" />
                                Ordine
                              </button>
                            )}
                            {!ordine.allegatoFattura && !ordine.allegatoOrdine && (
                              <span className="text-sm text-gray-400">Nessuno</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/ordini/${ordine.id}/modifica`)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Modifica"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteOrdineId(ordine.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Elimina"
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
                    onClick={() => navigate(`/clienti/${id}/ordini/nuovo`)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
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
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione cliente
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo cliente? Tutti gli ordini associati verranno
              eliminati. Questa azione non può essere annullata.
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Annulla
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDeleteCliente}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione ordine
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo ordine? Questa azione non può essere annullata.
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Annulla
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={() => deleteOrdineId && handleDeleteOrdine(deleteOrdineId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
