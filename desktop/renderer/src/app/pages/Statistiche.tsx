import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";

type ZoneKey = "paese" | "regione";

function getYear(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear().toString();
}

export function Statistiche() {
  const { ordini, modelli, getCliente, getModello } = useApp();
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = useMemo(() => {
    const yearsSet = new Set<string>([currentYear]);
    ordini.forEach((ordine) => {
      const year = getYear(ordine.dataOrdine);
      if (year) {
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [currentYear, ordini]);

  const filteredOrdini = useMemo(() => {
    if (!selectedYear) {
      return ordini;
    }

    return ordini.filter((ordine) => getYear(ordine.dataOrdine) === selectedYear);
  }, [ordini, selectedYear]);

  const topModelli = useMemo(() => {
    const counts = filteredOrdini.reduce<Record<string, number>>((acc, ordine) => {
      acc[ordine.modelloId] = (acc[ordine.modelloId] || 0) + 1;
      return acc;
    }, {});

    // Top 3 ordinato: un solo grafico leggibile invece di tanti chart piccoli.
    return Object.entries(counts)
      .map(([modelloId, ordiniCount]) => ({
        nome: getModello(modelloId)?.nome || "Senza nome",
        ordini: ordiniCount,
      }))
      .sort((a, b) => b.ordini - a.ordini)
      .slice(0, 3);
  }, [filteredOrdini, getModello]);

  const buildZoneStats = (key: ZoneKey) => {
    const zones = filteredOrdini.reduce<
      Record<string, { nome: string; ordini: number; clienti: Set<string> }>
    >((acc, ordine) => {
      const cliente = getCliente(ordine.clienteId);
      const zoneName = cliente?.[key] || "Non indicato";

      if (!acc[zoneName]) {
        acc[zoneName] = { nome: zoneName, ordini: 0, clienti: new Set<string>() };
      }

      acc[zoneName].ordini += 1;
      if (cliente) {
        acc[zoneName].clienti.add(cliente.id);
      }

      return acc;
    }, {});

    return Object.values(zones)
      .map((zone) => ({
        nome: zone.nome,
        ordini: zone.ordini,
        clienti: zone.clienti.size,
      }))
      .sort((a, b) => b.ordini - a.ordini);
  };

  const paeseStats = useMemo(() => buildZoneStats("paese"), [filteredOrdini, getCliente]);
  const regioneStats = useMemo(() => buildZoneStats("regione"), [filteredOrdini, getCliente]);

  const modelloPiuRichiesto = topModelli[0]?.nome || "N/A";

  const ZoneTable = ({
    title,
    rows,
  }: {
    title: string;
    rows: Array<{ nome: string; ordini: number; clienti: number }>;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-5 text-sm font-medium text-gray-700">Zona</th>
              <th className="text-right py-3 px-5 text-sm font-medium text-gray-700">Ordini</th>
              <th className="text-right py-3 px-5 text-sm font-medium text-gray-700">Clienti</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.nome} className="border-b border-gray-100">
                <td className="py-3 px-5 text-sm text-gray-900">{row.nome}</td>
                <td className="py-3 px-5 text-sm text-gray-700 text-right">{row.ordini}</td>
                <td className="py-3 px-5 text-sm text-gray-700 text-right">{row.clienti}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="py-10 text-center text-gray-500">Nessun dato disponibile</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Statistiche</h1>
        <p className="text-gray-600 mt-1">
          Modelli ordinati e distribuzione geografica, filtrati per anno.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anno</label>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">Tutti</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l border-gray-200 pl-4">
              <p className="text-sm text-gray-500">Ordini filtrati</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredOrdini.length}</p>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <p className="text-sm text-gray-500">Modelli totali</p>
              <p className="text-2xl font-semibold text-gray-900">{modelli.length}</p>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <p className="text-sm text-gray-500">Modello piu richiesto</p>
              <p className="text-xl font-semibold text-gray-900">{modelloPiuRichiesto}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Top 3 modelli ordinati</h2>
            <p className="text-sm text-gray-600">
              {selectedYear ? `Anno ${selectedYear}` : "Tutti gli anni"}
            </p>
          </div>
        </div>

        {topModelli.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topModelli}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="nome" tick={{ fill: "#4b5563" }} />
              <YAxis allowDecimals={false} tick={{ fill: "#4b5563" }} />
              <Tooltip
                cursor={{ fill: "#f3f4f6" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ordini" fill="#334155" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-500">
            Nessun dato disponibile
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ZoneTable title="Statistiche per paese" rows={paeseStats} />
        <ZoneTable title="Statistiche per regione" rows={regioneStats} />
      </div>
    </div>
  );
}
