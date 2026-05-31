import { useState } from "react";
import { Bot, Pencil, Check, X } from "lucide-react";
import { capitalize } from "@/lib/incidents";
import { updateIncidentPriority } from "@/services/api";

const PRIORITY_CONFIG = [
  { label: "Muy baja", bar: "bg-[#22C55E]", text: "text-green-700",  bg: "bg-green-100"  },
  { label: "Baja",     bar: "bg-[#84CC16]", text: "text-lime-700",   bg: "bg-lime-100"   },
  { label: "Media",    bar: "bg-[#EAB308]", text: "text-yellow-700", bg: "bg-yellow-100" },
  { label: "Alta",     bar: "bg-[#F97316]", text: "text-orange-700", bg: "bg-orange-100" },
  { label: "Crítica",  bar: "bg-[#EF4444]", text: "text-red-700",    bg: "bg-red-100"    },
];

export default function AIInsights({ incident, onUpdated }) {
  const [editing, setEditing]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [saving, setSaving]         = useState(false);

  const priority = Math.min(Math.max(Math.round(incident.priority ?? 1), 1), 5);
  const cfg      = PRIORITY_CONFIG[priority - 1];
  const hasAI    = incident.ai_justification || incident.ai_suggested_category;

  if (!hasAI) return null;

  const handleConfirm = async () => {
    if (!selected || selected === priority) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateIncidentPriority(incident._id, selected);
      onUpdated?.();
    } finally {
      setSaving(false);
      setEditing(false);
      setSelected(null);
    }
  };

  const handleCancel = () => { setEditing(false); setSelected(null); };

  return (
    <section className="rounded-2xl bg-violet-50 border border-violet-100 p-4 flex flex-col gap-4">

      <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 uppercase tracking-wider">
        <Bot size={13} />
        Análisis IA
      </span>

      {/* Prioridad */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Prioridad</span>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              editing && selected ? PRIORITY_CONFIG[selected-1].bg + " " + PRIORITY_CONFIG[selected-1].text : cfg.bg + " " + cfg.text
            }`}>
              {editing && selected ? `${selected}/5 — ${PRIORITY_CONFIG[selected-1].label}` : `${priority}/5 — ${cfg.label}`}
            </span>
            {!editing && (
              <button onClick={() => { setEditing(true); setSelected(priority); }} className="text-gray-400 hover:text-violet-500 transition-colors">
                <Pencil size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Barra */}
        <div className="flex gap-1">
          {PRIORITY_CONFIG.map((p, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < (editing && selected ? selected : priority) ? p.bar : "bg-gray-200"}`} />
          ))}
        </div>

        {/* Selector de prioridad */}
        {editing && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex gap-1.5">
              {PRIORITY_CONFIG.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i + 1)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border-2 ${
                    selected === i + 1
                      ? `${p.bg} ${p.text} border-current`
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={saving || selected === priority}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold disabled:opacity-50 transition-colors"
              >
                <Check size={13} />
                {saving ? "Guardando..." : "Confirmar"}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors"
              >
                <X size={13} />
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Categoría sugerida + Justificación */}
      <div className="flex flex-col gap-2 border-t border-violet-100 pt-3">
        {incident.ai_suggested_category && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Categoría sugerida</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {capitalize(incident.ai_suggested_category)}
            </span>
          </div>
        )}
        {incident.ai_justification && (
          <p className="text-xs text-gray-500 leading-relaxed italic">
            "{incident.ai_justification}"
          </p>
        )}
      </div>

    </section>
  );
}
