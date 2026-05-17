import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useApp } from "../context/AppContext";
import { SearchableSelect } from "../components/SearchableSelect";

type SortColumn = "nome" | "cognome" | "paese" | "dataUltimoOrdine" | "numOrdini";
type SortOrder = "asc" | "desc";

function getYear(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear().toString();
}

function getTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function Clienti() {
  const navigate = useNavigate();
  const { clienti, deleteCliente, getNumeroOrdiniCliente, ordini, getModello } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortColumn>("cognome");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredAndSortedClienti = useMemo(() => {
    let result = [...clienti];

    if (yearFilter) {
      result = result.filter((cliente) => {
        return ordini.some(
          (ordine) =>
            (ordine.clienteId === cliente.id || ordine.secondaPersonaId === cliente.id) &&
            getYear(ordine.dataOrdine) === yearFilter
        );
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((cliente) => {
        const clienteMatches = [
          cliente.nome,
          cliente.cognome,
          cliente.partitaIva,
          cliente.codiceFiscale,
          cliente.email,
          cliente.via,
          cliente.paese,
          cliente.provincia,
          cliente.cap,
          cliente.regione,
          cliente.telefoni.find((telefono) => telefono.principale)?.numero || "",
          cliente.telefoni[0]?.numero || "",
        ].some((value) => value.toLowerCase().includes(term));

        const modelloMatches = ordini.some(
          (ordine) =>
            (ordine.clienteId === cliente.id || ordine.secondaPersonaId === cliente.id) &&
            (!yearFilter || getYear(ordine.dataOrdine) === yearFilter) &&
            (getModello(ordine.modelloId)?.nome || "").toLowerCase().includes(term)
        );

        return clienteMatches || modelloMatches;
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
        compareA = getTimestamp(a.dataUltimoOrdine);
        compareB = getTimestamp(b.dataUltimoOrdine);
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
  }, [clienti, getModello, getNumeroOrdiniCliente, ordini, searchTerm, sortBy, sortOrder, yearFilter]);

  const formatOrderDate = (value?: string | null) => {
    if (!value) {
      return "Mai";
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Mai" : format(date, "dd/MM/yyyy");
  };

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    ordini.forEach((ordine) => {
      const year = getYear(ordine.dataOrdine);
      if (year) {
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [ordini]);

  const yearOptions = useMemo(
    () => years.map((year) => ({ value: year, label: year })),
    [years]
  );

  const primaryPhone = (clienteId: string) => {
    const cliente = clienti.find((item) => item.id === clienteId);
    return (
      cliente?.telefoni.find((telefono) => telefono.principale)?.numero ||
      cliente?.telefoni[0]?.numero ||
      "-"
    );
  };

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
                placeholder="Cerca cliente, telefono, paese o modello ordinato..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div className="md:w-56">
              <SearchableSelect
                value={yearFilter}
                onChange={setYearFilter}
                options={yearOptions}
                placeholder="Tutti gli anni"
                searchPlaceholder="Cerca anno..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader column="cognome" label="Cognome" />
                <SortHeader column="nome" label="Nome" />
                <th className="text-left py-3 px-5 text-sm font-medium text-gray-700">Via</th>
                <th className="text-left py-3 px-5 text-sm font-medium text-gray-700">Telefono</th>
                <SortHeader column="paese" label="Paese" />
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
                  <td className="py-4 px-5 text-sm text-gray-600">{cliente.via}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{primaryPhone(cliente.id)}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">{cliente.paese}</td>
                  <td className="py-4 px-5 text-sm text-gray-600">
                    {formatOrderDate(cliente.dataUltimoOrdine)}
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
