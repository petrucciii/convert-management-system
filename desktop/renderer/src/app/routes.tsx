import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Clienti } from "./pages/Clienti";
import { ClienteDetail } from "./pages/ClienteDetail";
import { ClienteForm } from "./pages/ClienteForm";
import { OrdineForm } from "./pages/OrdineForm";
import { TabelleDizionario } from "./pages/TabelleDizionario";
import { Statistiche } from "./pages/Statistiche";
import { MainLayout } from "./components/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, Component: Dashboard },
      { path: "clienti", Component: Clienti },
      { path: "clienti/nuovo", Component: ClienteForm },
      { path: "clienti/:id", Component: ClienteDetail },
      { path: "clienti/:id/modifica", Component: ClienteForm },
      { path: "clienti/:clienteId/ordini/nuovo", Component: OrdineForm },
      { path: "ordini/:id/modifica", Component: OrdineForm },
      { path: "dizionario", Component: TabelleDizionario },
      { path: "statistiche", Component: Statistiche },
    ],
  },
]);
