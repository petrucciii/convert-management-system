import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router";
import { Users, ShoppingCart, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export function Dashboard() {
  const { clienti, ordini, getCliente, getModello } = useApp();
  const navigate = useNavigate();

  const totaleClienti = clienti.length;
  const totaleOrdini = ordini.length;

  const ultimi5Ordini = [...ordini]
    .sort((a, b) => new Date(b.dataOrdine).getTime() - new Date(a.dataOrdine).getTime())
    .slice(0, 5);

  const clientiRecenti = [...clienti]
    .sort((a, b) => {
      const dateA = a.dataUltimoOrdine ? new Date(a.dataUltimoOrdine).getTime() : 0;
      const dateB = b.dataUltimoOrdine ? new Date(b.dataUltimoOrdine).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const ordiniPerMese = ordini.reduce((acc, ordine) => {
    const mese = format(new Date(ordine.dataOrdine), "MMMM", { locale: it });
    acc[mese] = (acc[mese] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const graficoMensile = Object.entries(ordiniPerMese).map(([mese, totale]) => ({
    mese: mese.charAt(0).toUpperCase() + mese.slice(1),
    ordini: totale,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Panoramica generale del gestionale</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Totale Clienti</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{totaleClienti}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Totale Ordini</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{totaleOrdini}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Ordini questo mese</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">
            {ordini.filter((o) => {
              const mese = new Date(o.dataOrdine).getMonth();
              return mese === new Date().getMonth();
            }).length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Media ordini/mese</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">
            {graficoMensile.length > 0
              ? Math.round(totaleOrdini / graficoMensile.length)
              : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordini per mese</h2>
          {graficoMensile.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={graficoMensile}>
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
          ) : (
            <p className="text-gray-500 text-center py-12">Nessun dato disponibile</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ultimi ordini</h2>
          <div className="space-y-3">
            {ultimi5Ordini.map((ordine) => {
              const cliente = getCliente(ordine.clienteId);
              const modello = getModello(ordine.modelloId);
              return (
                <div
                  key={ordine.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/clienti/${ordine.clienteId}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {cliente?.nome} {cliente?.cognome}
                    </p>
                    <p className="text-sm text-gray-600">{modello?.nome || "N/A"}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(ordine.dataOrdine), "dd MMM yyyy", { locale: it })}
                  </p>
                </div>
              );
            })}
            {ultimi5Ordini.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nessun ordine disponibile</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Clienti recenti</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cognome</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Telefono</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Ultimo ordine
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {clientiRecenti.map((cliente) => (
                <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{cliente.nome}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{cliente.cognome}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {cliente.telefoni.find((t) => t.principale)?.numero || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {cliente.dataUltimoOrdine
                      ? format(new Date(cliente.dataUltimoOrdine), "dd/MM/yyyy")
                      : "Mai"}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/clienti/${cliente.id}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Visualizza
                    </button>
                  </td>
                </tr>
              ))}
              {clientiRecenti.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Nessun cliente disponibile
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
