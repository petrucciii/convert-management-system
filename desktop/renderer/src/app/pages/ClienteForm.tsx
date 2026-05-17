import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useApp, Telefono } from "../context/AppContext";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

export function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addCliente, updateCliente, getCliente } = useApp();
  const isEdit = !!id;

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [partitaIva, setPartitaIva] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [dataNascita, setDataNascita] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [telefoni, setTelefoni] = useState<Telefono[]>([
    { id: "1", numero: "", principale: true },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      const cliente = getCliente(id);
      if (cliente) {
        setNome(cliente.nome);
        setCognome(cliente.cognome);
        setPartitaIva(cliente.partitaIva);
        setCodiceFiscale(cliente.codiceFiscale);
        setDataNascita(cliente.dataNascita);
        setIndirizzo(cliente.indirizzo);
        setTelefoni(cliente.telefoni);
      }
    }
  }, [id, isEdit, getCliente]);

  const addTelefono = () => {
    setTelefoni([...telefoni, { id: Date.now().toString(), numero: "", principale: false }]);
  };

  const removeTelefono = (id: string) => {
    if (telefoni.length === 1) {
      toast.error("Deve esserci almeno un telefono");
      return;
    }
    const removed = telefoni.find((t) => t.id === id);
    const newTelefoni = telefoni.filter((t) => t.id !== id);
    if (removed?.principale && newTelefoni.length > 0) {
      newTelefoni[0].principale = true;
    }
    setTelefoni(newTelefoni);
  };

  const updateTelefono = (id: string, numero: string) => {
    setTelefoni(telefoni.map((t) => (t.id === id ? { ...t, numero } : t)));
  };

  const setPrincipale = (id: string) => {
    setTelefoni(telefoni.map((t) => ({ ...t, principale: t.id === id })));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nome.trim()) newErrors.nome = "Il nome è obbligatorio";
    if (!cognome.trim()) newErrors.cognome = "Il cognome è obbligatorio";
    if (!partitaIva.trim()) newErrors.partitaIva = "La partita IVA è obbligatoria";
    if (!codiceFiscale.trim()) newErrors.codiceFiscale = "Il codice fiscale è obbligatorio";
    if (!dataNascita) newErrors.dataNascita = "La data di nascita è obbligatoria";
    if (!indirizzo.trim()) newErrors.indirizzo = "L'indirizzo è obbligatorio";

    telefoni.forEach((tel, idx) => {
      if (!tel.numero.trim()) {
        newErrors[`telefono-${idx}`] = "Il numero di telefono è obbligatorio";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const clienteData = {
      nome,
      cognome,
      partitaIva,
      codiceFiscale,
      dataNascita,
      indirizzo,
      telefoni,
    };

    if (isEdit && id) {
      updateCliente(id, clienteData);
      toast.success("Cliente aggiornato con successo");
    } else {
      addCliente(clienteData);
      toast.success("Cliente creato con successo");
    }

    navigate("/clienti");
  };

  return (
    <div className="p-8">
      <button
        onClick={() => navigate("/clienti")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Torna ai clienti
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          {isEdit ? "Modifica cliente" : "Aggiungi cliente"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? "Modifica le informazioni del cliente" : "Inserisci i dati del nuovo cliente"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati anagrafici</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErrors((prev) => ({ ...prev, nome: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.nome
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Inserisci il nome"
              />
              {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cognome <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={cognome}
                onChange={(e) => {
                  setCognome(e.target.value);
                  setErrors((prev) => ({ ...prev, cognome: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.cognome
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Inserisci il cognome"
              />
              {errors.cognome && <p className="text-red-600 text-sm mt-1">{errors.cognome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data di nascita <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={dataNascita}
                onChange={(e) => {
                  setDataNascita(e.target.value);
                  setErrors((prev) => ({ ...prev, dataNascita: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.dataNascita
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.dataNascita && (
                <p className="text-red-600 text-sm mt-1">{errors.dataNascita}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dati fiscali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partita IVA <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={partitaIva}
                onChange={(e) => {
                  setPartitaIva(e.target.value);
                  setErrors((prev) => ({ ...prev, partitaIva: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.partitaIva
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Inserisci la partita IVA"
              />
              {errors.partitaIva && (
                <p className="text-red-600 text-sm mt-1">{errors.partitaIva}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice fiscale <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={codiceFiscale}
                onChange={(e) => {
                  setCodiceFiscale(e.target.value);
                  setErrors((prev) => ({ ...prev, codiceFiscale: "" }));
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.codiceFiscale
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Inserisci il codice fiscale"
              />
              {errors.codiceFiscale && (
                <p className="text-red-600 text-sm mt-1">{errors.codiceFiscale}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indirizzo completo <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={indirizzo}
              onChange={(e) => {
                setIndirizzo(e.target.value);
                setErrors((prev) => ({ ...prev, indirizzo: "" }));
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.indirizzo
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Via, Numero, Città, CAP"
            />
            {errors.indirizzo && <p className="text-red-600 text-sm mt-1">{errors.indirizzo}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Contatti</h2>
            <button
              type="button"
              onClick={addTelefono}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Aggiungi telefono
            </button>
          </div>
          <div className="space-y-3">
            {telefoni.map((telefono, idx) => (
              <div key={telefono.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="tel"
                    value={telefono.numero}
                    onChange={(e) => {
                      updateTelefono(telefono.id, e.target.value);
                      setErrors((prev) => ({ ...prev, [`telefono-${idx}`]: "" }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors[`telefono-${idx}`]
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Inserisci il numero di telefono"
                  />
                  {errors[`telefono-${idx}`] && (
                    <p className="text-red-600 text-sm mt-1">{errors[`telefono-${idx}`]}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={telefono.principale}
                    onChange={() => setPrincipale(telefono.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  Principale
                </label>
                {telefoni.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTelefono(telefono.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/clienti")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEdit ? "Salva modifiche" : "Crea cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
