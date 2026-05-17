import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useApp } from "../context/AppContext";

type SortColumn = "nome" | "cognome" | "paese" | "dataUltimoOrdine" | "numOrdini";
type SortOrder = "asc" | "desc";

export function Clienti() {
  const navigate = useNavigate();
  const { clienti, deleteCliente, getNumeroOrdiniCliente } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortColumn>("cognome");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredAndSortedClienti = useMemo(() => {
    let result = [...clienti];

    // Ricerca ampia sui dati anagrafici e sui nuovi campi indirizzo separati.
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((cliente) =>
        [
          cliente.nome,
          cliente.cognome,
          cliente.partitaIva,
          cliente.codiceFiscale,
          cliente.via,
          cliente.paese,
          cliente.regione,
        ].some((value) => value.toLowerCase().includes(term))
      );
    }

    if (yearFilter) {
      result = result.filter((cliente) => {
        if (!cliente.dataUltimoOrdine) return false;
        return new Date(cliente.dataUltimoOrdine).getFullYear().toString() === yearFilter;
      });
    }

    result.sort((a, b) => {
      let compareA: string | number = "";
      let compareB: string | number = "";

      if (sortBy === "nome") {
        compareA = a.nome.toLowerCase();
        compareB = b.nome.toLowerCase();
      }
      if (sortBy === "cognome") {
        compareA = a.cognome.toLowerCase();
        compareB = b.cognome.toLowerCase();
      }
      if (sortBy === "paese") {
        compareA = a.paese.toLowerCase();
        compareB = b.paese.toLowerCase();
      }
      if (sortBy === "dataUltimoOrdine") {
        compareA = a.dataUltimoOrdine ? new Date(a.dataUltimoOrdine).getTime() : 0;
        compareB = b.dataUltimoOrdine ? new Date(b.dataUltimoOrdine).getTime() : 0;
      }
      if (sortBy === "numOrdini") {
        compareA = getNumeroOrdiniCliente(a.id);
        compareB = getNumeroOrdiniCliente(b.id);
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [clienti, getNumeroOrdiniCliente, searchTerm, sortBy, sortOrder, yearFilter]);

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    clienti.forEach((cliente) => {
      if (cliente.dataUltimoOrdine) {
        yearsSet.add(new Date(cliente.dataUltimoOrdine).getFullYear().toString());
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [clienti]);

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortOrder(column === "dataUltimoOrdine" || column === "numOrdini" ? "desc" : "asc");
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    toast.success("Cliente eliminato con successo");
    window.alert("Cliente eliminato con successo.");
    setDeleteId(null);
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }

    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-gray-700" />
    ) : (
      <ArrowDown className="w-4 h-4 text-gray-700" />
    );
  };

  const SortHeader = ({
    column,
    label,
    className = "",
  }: {
    column: SortColumn;
    label: string;
    className?: string;
  }) => (
    <th className={`py-3 px-5 text-left text-sm font-medium text-gray-700 ${className}`}>
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="inline-flex items-center gap-1.5 hover:text-gray-950"
      >
        {label}
        <SortIcon column={column} />
      </button>
    </th>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Clienti</h1>
          <p className="text-gray-600 mt-1">Lista anagrafica e stato ordini</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/clienti/nuovo")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Aggiungi cliente
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca nome, cognome, CF, P.IVA, paese, regione..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">Tutti gli anni</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader column="cognome" label="Cognome" />
                <SortHeader column="nome" label="Nome" />
                <th className="text-left py-3 px-5 text-sm font-medium text-gray-700">CF</th>
                <th className="text-left py-3 px-5 text-sm font-medium text-gray-700">P. IVA</th>
                <th className="text-left py-3 px-5 text-sm font-medium text-gray-700">Via</th>
                <SortHeader column="paese" label="Paese" />
                <th className="text-left py-3 px-5 text-sm font-medium text-gray-700">Regione</th>
                <SortHeader column="dataUltimoOrdine" label="Ultimo ordine" />
                <SortHeader column="numOrdini" label="Ordini" />
                <th className="text-right py-3 px-5 text-sm font-medium text-gray-700">
                  Elimina
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedClienti.map((cliente) => (
                <tr
                  key={cliente.id}
                  onClick={() => navigate(`/clienti/${cliente.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-4 px-5 text-sm text-gray-900 font-medium">
                    {cliente.cognome}
                  </td>
                  <td className="py-4 px-5 text-sm text-gray-900">{cliente.nome}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{cliente.codiceFiscale}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{cliente.partitaIva}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{cliente.via}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{cliente.paese}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{cliente.regione}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">
                    {cliente.dataUltimoOrdine
                      ? format(new Date(cliente.dataUltimoOrdine), "dd/MM/yyyy")
                      : "Mai"}
                  </td>
                  <td className="py-4 px-5 text-sm text-gray-900">
                    {getNumeroOrdiniCliente(cliente.id)}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteId(cliente.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Elimina cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Conferma eliminazione
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
                  onClick={() => deleteId && handleDelete(deleteId)}
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
