import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { TrendingUp, Users, ShoppingCart, Package } from "lucide-react";

export function Statistiche() {
  const { ordini, clienti, modelli, getCliente, getModello } = useApp();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedModello, setSelectedModello] = useState("");

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    ordini.forEach((o) => {
      yearsSet.add(new Date(o.dataOrdine).getFullYear().toString());
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [ordini]);

  const filteredOrdini = useMemo(() => {
    let result = [...ordini];

    if (selectedYear) {
      result = result.filter((o) => {
        return new Date(o.dataOrdine).getFullYear().toString() === selectedYear;
      });
    }

    if (dateFrom) {
      result = result.filter((o) => {
        return new Date(o.dataOrdine) >= new Date(dateFrom);
      });
    }

    if (dateTo) {
      result = result.filter((o) => {
        return new Date(o.dataOrdine) <= new Date(dateTo);
      });
    }

    if (selectedModello) {
      result = result.filter((o) => o.modelloId === selectedModello);
    }

    return result;
  }, [ordini, selectedYear, dateFrom, dateTo, selectedModello]);

  const ordiniPerMese = useMemo(() => {
    const mesi = [
      "Gen",
      "Feb",
      "Mar",
      "Apr",
      "Mag",
      "Giu",
      "Lug",
      "Ago",
      "Set",
      "Ott",
      "Nov",
      "Dic",
    ];
    const counts = new Array(12).fill(0);

    filteredOrdini.forEach((ordine) => {
      const mese = new Date(ordine.dataOrdine).getMonth();
      counts[mese]++;
    });

    return mesi.map((mese, idx) => ({
      mese,
      ordini: counts[idx],
    }));
  }, [filteredOrdini]);

  const modelliPiuOrdinati = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredOrdini.forEach((ordine) => {
      counts[ordine.modelloId] = (counts[ordine.modelloId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([modelloId, count]) => {
        const modello = getModello(modelloId);
        return {
          nome: modello?.nome || "N/A",
          ordini: count,
        };
      })
      .sort((a, b) => b.ordini - a.ordini)
      .slice(0, 5);
  }, [filteredOrdini, getModello]);

  const clientiConPiuOrdini = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredOrdini.forEach((ordine) => {
      counts[ordine.clienteId] = (counts[ordine.clienteId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([clienteId, count]) => {
        const cliente = getCliente(clienteId);
        return {
          nome: cliente ? `${cliente.nome} ${cliente.cognome}` : "N/A",
          ordini: count,
        };
      })
      .sort((a, b) => b.ordini - a.ordini)
      .slice(0, 5);
  }, [filteredOrdini, getCliente]);

  const modelloPiuRichiesto = useMemo(() => {
    if (modelliPiuOrdinati.length === 0) return "N/A";
    return modelliPiuOrdinati[0].nome;
  }, [modelliPiuOrdinati]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Statistiche</h1>
        <p className="text-gray-600 mt-1">Analisi e report dei dati aziendali</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anno</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data da</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data a</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modello</label>
            <select
              value={selectedModello}
              onChange={(e) => setSelectedModello(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tutti</option>
              {modelli.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Totale ordini</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{filteredOrdini.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Totale clienti</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{clienti.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            {selectedYear ? `Ordini ${selectedYear}` : "Ordini totali"}
          </p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{filteredOrdini.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Modello più richiesto</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{modelloPiuRichiesto}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordini per mese</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordiniPerMese}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mese" tick={{ fill: "#6b7280" }} />
              <YAxis tick={{ fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ordini" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modelli più ordinati</h2>
          {modelliPiuOrdinati.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelliPiuOrdinati}
                  dataKey="ordini"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.nome}: ${entry.ordini}`}
                >
                  {modelliPiuOrdinati.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">Nessun dato disponibile</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 modelli</h2>
          <div className="space-y-3">
            {modelliPiuOrdinati.map((modello, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-semibold">
                    {idx + 1}
                  </div>
                  <p className="font-medium text-gray-900">{modello.nome}</p>
                </div>
                <p className="text-gray-600 font-semibold">{modello.ordini} ordini</p>
              </div>
            ))}
            {modelliPiuOrdinati.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nessun dato disponibile</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 clienti</h2>
          <div className="space-y-3">
            {clientiConPiuOrdini.map((cliente, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-semibold">
                    {idx + 1}
                  </div>
                  <p className="font-medium text-gray-900">{cliente.nome}</p>
                </div>
                <p className="text-gray-600 font-semibold">{cliente.ordini} ordini</p>
              </div>
            ))}
            {clientiConPiuOrdini.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nessun dato disponibile</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
