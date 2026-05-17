import { useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { Modello, PaeseDizionario, RegioneDizionario, useApp } from "../context/AppContext";
import { SearchableSelect } from "../components/SearchableSelect";

type DictionaryTable = "modelli" | "regioni" | "paesi";

type EditTarget =
  | { table: "modelli"; item: Modello }
  | { table: "regioni"; item: RegioneDizionario }
  | { table: "paesi"; item: PaeseDizionario };

type DeleteTarget = { table: DictionaryTable; id: string };

type FormData = {
  nome: string;
  descrizione: string;
  regionId: string;
  provincia: string;
  cap: string;
};

const emptyForm: FormData = {
  nome: "",
  descrizione: "",
  regionId: "",
  provincia: "",
  cap: "",
};

const tabs: Array<{ id: DictionaryTable; label: string; action: string }> = [
  { id: "modelli", label: "Modelli", action: "Aggiungi modello" },
  { id: "regioni", label: "Regioni", action: "Aggiungi regione" },
  { id: "paesi", label: "Paesi", action: "Aggiungi paese" },
];

export function TabelleDizionario() {
  const {
    modelli,
    addModello,
    updateModello,
    deleteModello,
    regioni,
    addRegione,
    updateRegione,
    deleteRegione,
    paesi,
    addPaese,
    updatePaese,
    deletePaese,
    ordini,
    getRegione,
  } = useApp();

  const [activeTable, setActiveTable] = useState<DictionaryTable>("modelli");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const filteredModelli = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return modelli.filter((modello) =>
      [modello.nome, modello.descrizione || ""].some((value) => value.toLowerCase().includes(term))
    );
  }, [modelli, searchTerm]);

  const filteredRegioni = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return regioni.filter((regione) =>
      [regione.name, regione.description || ""].some((value) => value.toLowerCase().includes(term))
    );
  }, [regioni, searchTerm]);

  const filteredPaesi = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return paesi.filter((paese) =>
      [
        paese.name,
        paese.province || "",
        paese.postal_code || "",
        paese.region?.name || "",
        getRegione(paese.region_id || "")?.name || "",
        paese.description || "",
      ].some((value) => value.toLowerCase().includes(term))
    );
  }, [getRegione, paesi, searchTerm]);

  const activeTab = tabs.find((tab) => tab.id === activeTable) || tabs[0];
  const regionOptions = useMemo(
    () =>
      regioni.map((regione) => ({
        value: regione.id,
        label: regione.name || "Senza nome",
        searchText: regione.description || "",
      })),
    [regioni]
  );

  const getRegionName = (paese: PaeseDizionario) => {
    return paese.region?.name || getRegione(paese.region_id || "")?.name || "-";
  };

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (target: EditTarget) => {
    setEditTarget(target);

    if (target.table === "modelli") {
      setFormData({
        ...emptyForm,
        nome: target.item.nome || "",
        descrizione: target.item.descrizione || "",
      });
    }

    if (target.table === "regioni") {
      setFormData({
        ...emptyForm,
        nome: target.item.name || "",
        descrizione: target.item.description || "",
      });
    }

    if (target.table === "paesi") {
      setFormData({
        nome: target.item.name || "",
        descrizione: target.item.description || "",
        regionId: target.item.region_id || "",
        provincia: target.item.province || "",
        cap: target.item.postal_code || "",
      });
    }

    setIsModalOpen(true);
  };

  const handleSubmitModal = (event: React.FormEvent) => {
    event.preventDefault();

    const table = editTarget?.table || activeTable;

    if (table === "modelli") {
      const payload = { nome: formData.nome, descrizione: formData.descrizione };
      editTarget?.table === "modelli"
        ? updateModello(editTarget.item.id, payload)
        : addModello(payload);
    }

    if (table === "regioni") {
      const payload = { name: formData.nome, description: formData.descrizione };
      editTarget?.table === "regioni"
        ? updateRegione(editTarget.item.id, payload)
        : addRegione(payload);
    }

    if (table === "paesi") {
      const payload = {
        region_id: formData.regionId || null,
        name: formData.nome,
        province: formData.provincia,
        postal_code: formData.cap,
        description: formData.descrizione,
      };
      editTarget?.table === "paesi" ? updatePaese(editTarget.item.id, payload) : addPaese(payload);
    }

    toast.success(editTarget ? "Voce aggiornata con successo" : "Voce creata con successo");
    setIsModalOpen(false);
  };

  const isModelloUsed = (id: string) => {
    return ordini.some((ordine) => ordine.modelloId === id);
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.table === "modelli") {
      const success = deleteModello(deleteTarget.id);
      const message = success
        ? "Modello eliminato con successo."
        : "Impossibile eliminare: il modello e utilizzato in uno o piu ordini.";
      success ? toast.success(message) : toast.error(message);
      window.alert(message);
    }

    if (deleteTarget.table === "regioni") {
      deleteRegione(deleteTarget.id);
      toast.success("Regione eliminata con successo");
      window.alert("Regione eliminata con successo.");
    }

    if (deleteTarget.table === "paesi") {
      deletePaese(deleteTarget.id);
      toast.success("Paese eliminato con successo");
      window.alert("Paese eliminato con successo.");
    }

    setDeleteTarget(null);
  };

  const renderRows = () => {
    if (activeTable === "modelli") {
      return filteredModelli.map((modello) => (
        <tr key={modello.id} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="py-4 px-6 text-sm text-gray-900 font-medium">
            {modello.nome || "Senza nome"}
          </td>
          <td className="py-4 px-6 text-sm text-gray-600">{modello.descrizione || "-"}</td>
          <td className="py-4 px-6 text-right">
            <RowActions
              onEdit={() => handleOpenEdit({ table: "modelli", item: modello })}
              onDelete={() => setDeleteTarget({ table: "modelli", id: modello.id })}
            />
          </td>
        </tr>
      ));
    }

    if (activeTable === "regioni") {
      return filteredRegioni.map((regione) => (
        <tr key={regione.id} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="py-4 px-6 text-sm text-gray-900 font-medium">
            {regione.name || "Senza nome"}
          </td>
          <td className="py-4 px-6 text-sm text-gray-600">{regione.description || "-"}</td>
          <td className="py-4 px-6 text-right">
            <RowActions
              onEdit={() => handleOpenEdit({ table: "regioni", item: regione })}
              onDelete={() => setDeleteTarget({ table: "regioni", id: regione.id })}
            />
          </td>
        </tr>
      ));
    }

    return filteredPaesi.map((paese) => (
      <tr key={paese.id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-6 text-sm text-gray-900 font-medium">
          {paese.name || "Senza nome"}
        </td>
        <td className="py-4 px-6 text-sm text-gray-600">{paese.province || "-"}</td>
        <td className="py-4 px-6 text-sm text-gray-600">{paese.postal_code || "-"}</td>
        <td className="py-4 px-6 text-sm text-gray-600">{getRegionName(paese)}</td>
        <td className="py-4 px-6 text-sm text-gray-600">{paese.description || "-"}</td>
        <td className="py-4 px-6 text-right">
          <RowActions
            onEdit={() => handleOpenEdit({ table: "paesi", item: paese })}
            onDelete={() => setDeleteTarget({ table: "paesi", id: paese.id })}
          />
        </td>
      </tr>
    ));
  };

  const emptyMessage =
    activeTable === "modelli"
      ? "Nessun modello trovato"
      : activeTable === "regioni"
        ? "Nessuna regione trovata"
        : "Nessun paese trovato";

  const rowCount =
    activeTable === "modelli"
      ? filteredModelli.length
      : activeTable === "regioni"
        ? filteredRegioni.length
        : filteredPaesi.length;

  const deleteBlocked = deleteTarget?.table === "modelli" && isModelloUsed(deleteTarget.id);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Tabelle dizionario</h1>
          <p className="text-gray-600 mt-1">Modelli, regioni e paesi usati dalle anagrafiche</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {activeTab.action}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTable(tab.id);
                  setSearchTerm("");
                }}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  activeTable === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cerca in ${activeTab.label.toLowerCase()}...`}
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
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Nome</th>
                {activeTable === "paesi" && (
                  <>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                      Provincia
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">CAP</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                      Regione
                    </th>
                  </>
                )}
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                  Descrizione
                </th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>

          {rowCount === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-lg z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editTarget ? "Modifica voce" : activeTab.action}
            </Dialog.Title>
            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Nome"
                />
              </div>

              {(editTarget?.table || activeTable) === "paesi" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(event) =>
                        setFormData({ ...formData, provincia: event.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Provincia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CAP</label>
                    <input
                      type="text"
                      value={formData.cap}
                      onChange={(event) => setFormData({ ...formData, cap: event.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="CAP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Regione</label>
                    <SearchableSelect
                      value={formData.regionId}
                      onChange={(value) => setFormData({ ...formData, regionId: value })}
                      options={regionOptions}
                      placeholder="Nessuna"
                      searchPlaceholder="Cerca regione..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                <textarea
                  value={formData.descrizione}
                  onChange={(event) =>
                    setFormData({ ...formData, descrizione: event.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Descrizione"
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
                  Salva
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-6">
              {deleteBlocked
                ? "Questo modello e utilizzato in uno o piu ordini e non puo essere eliminato."
                : "Sei sicuro di voler eliminare questa voce?"}
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  {deleteBlocked ? "Chiudi" : "Annulla"}
                </button>
              </AlertDialog.Cancel>
              {!deleteBlocked && (
                <AlertDialog.Action asChild>
                  <button
                    type="button"
                    onClick={handleDelete}
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

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        title="Modifica"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
        title="Elimina"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
