import { useState } from "react";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { Modello, useApp } from "../context/AppContext";

function showDeleteAlert(message: string) {
  window.alert(message);
}

export function TabelleDizionario() {
  const { modelli, addModello, updateModello, deleteModello, ordini } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editModello, setEditModello] = useState<Modello | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: "", descrizione: "" });

  const filteredModelli = modelli.filter((modello) =>
    (modello.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditModello(null);
    setFormData({ nome: "", descrizione: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (modello: Modello) => {
    setEditModello(modello);
    setFormData({
      nome: modello.nome || "",
      descrizione: modello.descrizione || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = (event: React.FormEvent) => {
    event.preventDefault();

    // Nessun campo obbligatorio nel dizionario: Laravel potra validare regole piu strette se servono.
    if (editModello) {
      updateModello(editModello.id, formData);
      toast.success("Modello aggiornato con successo");
    } else {
      addModello(formData);
      toast.success("Modello creato con successo");
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const success = deleteModello(id);

    if (success) {
      toast.success("Modello eliminato con successo");
      showDeleteAlert("Modello eliminato con successo.");
    } else {
      toast.error("Impossibile eliminare: il modello e utilizzato in uno o piu ordini.");
      showDeleteAlert("Impossibile eliminare: il modello e utilizzato in uno o piu ordini.");
    }

    setDeleteId(null);
  };

  const isModelloUsed = (id: string) => {
    return ordini.some((ordine) => ordine.modelloId === id);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Tabelle dizionario</h1>
          <p className="text-gray-600 mt-1">Gestisci i modelli disponibili</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Aggiungi modello
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca modello..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                  Nome modello
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                  Descrizione
                </th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredModelli.map((modello) => (
                <tr key={modello.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                    {modello.nome || "Senza nome"}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {modello.descrizione || "-"}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(modello)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="Modifica"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(modello.id)}
                        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredModelli.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">Nessun modello trovato</p>
            </div>
          )}
        </div>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editModello ? "Modifica modello" : "Aggiungi modello"}
            </Dialog.Title>
            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome modello
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Inserisci il nome del modello"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(event) =>
                    setFormData({ ...formData, descrizione: event.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Inserisci una descrizione"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                  {editModello ? "Salva modifiche" : "Crea modello"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-6">
              {deleteId && isModelloUsed(deleteId)
                ? "Questo modello e utilizzato in uno o piu ordini e non puo essere eliminato."
                : "Sei sicuro di voler eliminare questo modello?"}
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  {deleteId && isModelloUsed(deleteId) ? "Chiudi" : "Annulla"}
                </button>
              </AlertDialog.Cancel>
              {deleteId && !isModelloUsed(deleteId) && (
                <AlertDialog.Action asChild>
                  <button
                    type="button"
                    onClick={() => handleDelete(deleteId)}
                    className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
                  >
                    Elimina
                  </button>
                </AlertDialog.Action>
              )}
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
