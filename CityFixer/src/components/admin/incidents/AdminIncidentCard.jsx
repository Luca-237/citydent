import { useState } from "react";
import { MapPin, AlertTriangle, Archive, Users } from "lucide-react";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";
import { formatDate } from "@/components/home/IncidentCard";
import IncidentDetailSheet from "@/components/home/IncidentDetailSheet";
import IncidentAdminActions from "./IncidentAdminActions";

const STATUS_BADGE = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-blanquito/20 text-azul-oscuro border border-blanquito/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border border-gray-200",
};

function getPriorityDot(p) {
  if (p <= 2) return "bg-green-400";
  if (p <= 4) return "bg-blue-400";
  if (p <= 6) return "bg-amber-400";
  if (p <= 8) return "bg-orange-500";
  return "bg-red-500";
}

function getPriorityLabel(p) {
  if (p <= 2) return "Muy baja";
  if (p <= 4) return "Baja";
  if (p <= 6) return "Media";
  if (p <= 8) return "Alta";
  return "Crítica";
}

export default function AdminIncidentCard({ incident, onUpdated, isReadOnly = false }) {
  const [open, setOpen] = useState(false);

  const statusKey = incident.status?.name;
  const label     = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const badgeCls  = STATUS_BADGE[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";
  const priority  = incident.priority ?? 1;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={`bg-white border border-slate-100 rounded-xl shadow-xs p-3.5 cursor-pointer active:bg-slate-50 transition-colors ${isReadOnly ? "opacity-60" : ""}`}
      >
        {/* Fila superior: título + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
              {incident.representativeId?.title}
            </p>
            {incident.representativeId?.is_dubious && (
              <AlertTriangle size={13} className="shrink-0 text-orange-400" />
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                <Archive size={9} /> Archivado
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeCls}`}>
              {label}
            </span>
          </div>
        </div>

        {/* Fila medial: dirección • categoría • reportes */}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
          <MapPin size={11} className="shrink-0 text-slate-400" />
          <span className="truncate">{incident.representativeId?.location?.address ?? "—"}</span>
          {incident.category?.name && (
            <>
              <span className="shrink-0 text-slate-300">•</span>
              <span className="shrink-0">{capitalize(incident.category.name)}</span>
            </>
          )}
          {incident.incidents?.length > 1 && (
            <>
              <span className="shrink-0 text-slate-300">•</span>
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                <Users size={9} />
                {incident.incidents.length}
              </span>
            </>
          )}
        </div>

        {/* Fila inferior: prioridad + fecha */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityDot(priority)}`} />
            <span className="text-[11px] text-slate-400">{priority} — {getPriorityLabel(priority)}</span>
          </div>
          <span className="text-[11px] text-slate-400">{formatDate(incident.representativeId?.createdAt)}</span>
        </div>
      </div>

      <IncidentDetailSheet
        incident={incident}
        open={open}
        onOpenChange={setOpen}
        isAdmin
        onUpdated={onUpdated}
        actions={
          isReadOnly ? null : (
            <IncidentAdminActions
              incident={incident}
              onUpdated={() => { onUpdated?.(); setOpen(false); }}
            />
          )
        }
      />
    </>
  );
}
