import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    // Provider unico: stato locale + chiamate AJAX relative per il backend Laravel.
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}
