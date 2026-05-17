import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../context/AppContext";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

export function Clienti() {
  const navigate = useNavigate();
  const { clienti, deleteCliente, getOrdiniByCliente } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState<"nome" | "cognome" | "dataUltimoOrdine" | "numOrdini">("nome");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredAndSortedClienti = useMemo(() => {
    let result = [...clienti];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.nome.toLowerCase().includes(term) ||
          c.cognome.toLowerCase().includes(term) ||
          c.partitaIva.toLowerCase().includes(term) ||
          c.codiceFiscale.toLowerCase().includes(term)
      );
    }

    if (yearFilter) {
      result = result.filter((c) => {
        if (!c.dataUltimoOrdine) return false;
        return new Date(c.dataUltimoOrdine).getFullYear().toString() === yearFilter;
      });
    }

    result.sort((a, b) => {
      let compareA: string | number = "";
      let compareB: string | number = "";

      if (sortBy === "nome") {
        compareA = a.nome.toLowerCase();
        compareB = b.nome.toLowerCase();
      } else if (sortBy === "cognome") {
        compareA = a.cognome.toLowerCase();
        compareB = b.cognome.toLowerCase();
      } else if (sortBy === "dataUltimoOrdine") {
        compareA = a.dataUltimoOrdine ? new Date(a.dataUltimoOrdine).getTime() : 0;
        compareB = b.dataUltimoOrdine ? new Date(b.dataUltimoOrdine).getTime() : 0;
      } else if (sortBy === "numOrdini") {
        compareA = getOrdiniByCliente(a.id).length;
        compareB = getOrdiniByCliente(b.id).length;
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [clienti, searchTerm, yearFilter, sortBy, sortOrder, getOrdiniByCliente]);

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    clienti.forEach((c) => {
      if (c.dataUltimoOrdine) {
        yearsSet.add(new Date(c.dataUltimoOrdine).getFullYear().toString());
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [clienti]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    toast.success("Cliente eliminato con successo");
    setDeleteId(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Clienti</h1>
          <p className="text-gray-600 mt-1">Gestisci tutti i tuoi clienti</p>
        </div>
        <button
          onClick={() => navigate("/clienti/nuovo")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Aggiungi cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca per nome, cognome, P.IVA o C.F."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti gli anni</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [col, order] = e.target.value.split("-");
                setSortBy(col as typeof sortBy);
                setSortOrder(order as "asc" | "desc");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nome-asc">Nome (A-Z)</option>
              <option value="nome-desc">Nome (Z-A)</option>
              <option value="cognome-asc">Cognome (A-Z)</option>
              <option value="cognome-desc">Cognome (Z-A)</option>
              <option value="dataUltimoOrdine-desc">Ultimo ordine (recente)</option>
              <option value="dataUltimoOrdine-asc">Ultimo ordine (vecchio)</option>
              <option value="numOrdini-desc">N. ordini (maggiore)</option>
              <option value="numOrdini-asc">N. ordini (minore)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Nome</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Cognome</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">P. IVA</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">C.F.</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                  Data nascita
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Indirizzo</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Telefono</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                  Ultimo ordine
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedClienti.map((cliente) => (
                <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-900">{cliente.nome}</td>
                  <td className="py-4 px-6 text-sm text-gray-900">{cliente.cognome}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{cliente.partitaIva}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{cliente.codiceFiscale}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {format(new Date(cliente.dataNascita), "dd/MM/yyyy")}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{cliente.indirizzo}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {cliente.telefoni.find((t) => t.principale)?.numero || "N/A"}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {cliente.dataUltimoOrdine
                      ? format(new Date(cliente.dataUltimoOrdine), "dd/MM/yyyy")
                      : "Mai"}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/clienti/${cliente.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizza"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/clienti/${cliente.id}/modifica`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(cliente.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          {filteredAndSortedClienti.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">Nessun cliente trovato</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog.Root open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo cliente? Tutti gli ordini associati verranno eliminati. Questa
              azione non può essere annullata.
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Annulla
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={() => deleteId && handleDelete(deleteId)}
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
