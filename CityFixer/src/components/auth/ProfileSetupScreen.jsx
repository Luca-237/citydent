import { useState, useEffect } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { sendVerificationCode, patchProfile, getNeighborhoods } from "@/services/api";

const INPUT_CLS =
  "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-celestito";

const LABEL_CLS = "text-xs font-semibold text-gray-500 uppercase tracking-wider";

const DNI_REGEX = /^\d{8}$/;
const TELEFONO_REGEX = /^\d{10}$/;
const CODIGO_POSTAL_REGEX = /^\d{4}([A-Za-z]{3})?$/;

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLS}>{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function ProfileSetupScreen({ onComplete, onSignOut }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [form, setForm] = useState({
    dni: "", telefono: "", direccion: "", ciudad: "",
    barrioId: "", provincia: "", codigoPostal: "",
  });
  const [errors, setErrors] = useState({});

  // Flujo OTP
  const [codeSent, setCodeSent]       = useState(false);
  const [verificationToken, setToken] = useState("");
  const [sending, setSending]         = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [serverError, setServerError]       = useState(null);
  const [neighborhoodsError, setNeighborhoodsError] = useState(false);

  useEffect(() => {
    getNeighborhoods()
      .then(({ data }) => setNeighborhoods(data.neighborhoods ?? []))
      .catch(() => setNeighborhoodsError(true));
  }, []);

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!DNI_REGEX.test(form.dni.replace(/\D/g, "")))
      e.dni = "El DNI debe tener exactamente 8 dígitos.";
    if (!TELEFONO_REGEX.test(form.telefono.replace(/\D/g, "")))
      e.telefono = "El teléfono debe tener exactamente 10 dígitos.";
    if (form.direccion.trim().length < 3)
      e.direccion = "La dirección es obligatoria.";
    if (form.ciudad.trim().length < 2)
      e.ciudad = "La ciudad es obligatoria.";
    if (!form.barrioId)
      e.barrioId = "Seleccioná un barrio.";
    if (form.provincia.trim().length < 2)
      e.provincia = "La provincia es obligatoria.";
    if (!CODIGO_POSTAL_REGEX.test(form.codigoPostal.trim()))
      e.codigoPostal = "Debe tener 4 dígitos o formato CPA (ej: A1234ABC).";
    return e;
  };

  const handleSendCode = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSending(true);
    setServerError(null);
    try {
      await sendVerificationCode();
      setCodeSent(true);
    } catch (err) {
      setServerError(err.response?.data?.error ?? "No se pudo enviar el código.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationToken.trim()) {
      setErrors((prev) => ({ ...prev, token: "Ingresá el código que recibiste." }));
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await patchProfile({
        dni:               form.dni.replace(/\D/g, ""),
        telefono:          form.telefono.replace(/\D/g, ""),
        direccion:         form.direccion.trim(),
        ciudad:            form.ciudad.trim(),
        barrioId:          form.barrioId,
        provincia:         form.provincia.trim(),
        codigoPostal:      form.codigoPostal.trim().toUpperCase(),
        verificationToken: verificationToken.trim(),
      });
      onComplete();
    } catch (err) {
      const detail = err.response?.data?.details;
      if (detail) {
        setServerError(detail.join(" · "));
      } else {
        setServerError(err.response?.data?.error ?? "Error al guardar el perfil.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-azul-oscuro flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-blanquito w-1.5 h-8 rounded-full inline-block" />
            <h1 className="text-white text-2xl font-bold tracking-tight">CityFixer</h1>
          </div>
          <p className="text-white/50 text-xs text-center">Tu ciudad, tu voz</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-azul-oscuro font-bold text-lg">Completá tu perfil</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Necesitamos tus datos para que puedas reportar incidentes.
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              Cerrar sesión
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <Field label="DNI" error={errors.dni}>
              <input
                type="text" inputMode="numeric" maxLength={8}
                placeholder="12345678"
                value={form.dni} onChange={set("dni")}
                className={INPUT_CLS}
              />
            </Field>

            <Field label="Teléfono" error={errors.telefono}>
              <input
                type="text" inputMode="numeric" maxLength={10}
                placeholder="3514001234"
                value={form.telefono} onChange={set("telefono")}
                className={INPUT_CLS}
              />
            </Field>

            <Field label="Dirección" error={errors.direccion}>
              <input
                type="text"
                placeholder="Av. Siempreviva 742"
                value={form.direccion} onChange={set("direccion")}
                className={INPUT_CLS}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ciudad" error={errors.ciudad}>
                <input
                  type="text"
                  placeholder="Villa María"
                  value={form.ciudad} onChange={set("ciudad")}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Provincia" error={errors.provincia}>
                <input
                  type="text"
                  placeholder="Córdoba"
                  value={form.provincia} onChange={set("provincia")}
                  className={INPUT_CLS}
                />
              </Field>
            </div>

            <Field label="Barrio" error={errors.barrioId ?? (neighborhoodsError ? "No se pudieron cargar los barrios. Revisá la conexión." : null)}>
              <select
                value={form.barrioId} onChange={set("barrioId")}
                className={INPUT_CLS}
                disabled={neighborhoodsError}
              >
                <option value="">
                  {neighborhoodsError ? "Error al cargar barrios" : neighborhoods.length === 0 ? "Cargando..." : "Seleccioná un barrio..."}
                </option>
                {neighborhoods.map((n) => (
                  <option key={n._id} value={n._id}>{n.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Código postal" error={errors.codigoPostal}>
              <input
                type="text" maxLength={7}
                placeholder="5900"
                value={form.codigoPostal} onChange={set("codigoPostal")}
                className={INPUT_CLS}
              />
            </Field>

            {/* Separador OTP */}
            <div className="w-full h-px bg-gray-100" />

            {!codeSent ? (
              <>
                {serverError && (
                  <p className="text-xs text-red-500 text-center">{serverError}</p>
                )}
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-azul-oscuro text-white text-sm font-semibold disabled:opacity-50 hover:bg-azul transition-colors"
                >
                  {sending
                    ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                    : <><Mail size={15} /> Verificar por mail</>
                  }
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <p className="text-xs font-medium">Código enviado a tu correo.</p>
                </div>

                <Field label="Código de verificación" error={errors.token}>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    placeholder="123456"
                    value={verificationToken}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setErrors((prev) => ({ ...prev, token: null }));
                    }}
                    className={INPUT_CLS}
                  />
                </Field>

                {serverError && (
                  <p className="text-xs text-red-500 text-center">{serverError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !verificationToken.trim()}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-azul-oscuro text-white text-sm font-semibold disabled:opacity-50 hover:bg-azul transition-colors"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  Completar perfil
                </button>

                <button
                  type="button"
                  onClick={() => { setCodeSent(false); setToken(""); setServerError(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600 text-center transition-colors"
                >
                  Reenviar código
                </button>
              </>
            )}

          </form>
        </div>

      </div>
    </div>
  );
}
