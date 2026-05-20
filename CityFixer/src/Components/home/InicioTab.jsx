import { ChevronRight, ClipboardList, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import IncidentCard, { EmptyState } from "./IncidentCard";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-4">
        <Icon size={18} className={`mb-2 ${color}`} />
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function InicioTab({ user, incidents, onVerTodos, onNuevoReporte }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const kpis = [
    { label: "Reportados",  value: incidents.length,                                           icon: ClipboardList, color: "text-[#292D60]" },
    { label: "En revisión", value: incidents.filter((i) => i.estado === "En revisión").length, icon: Clock,         color: "text-[#3B418F]" },
    { label: "Resueltos",   value: incidents.filter((i) => i.estado === "Resuelto").length,    icon: CheckCircle2,  color: "text-green-600" },
    { label: "Rechazados",  value: incidents.filter((i) => i.estado === "Rechazado").length,   icon: XCircle,       color: "text-red-500"   },
  ];

  const recent = incidents.slice(0, 3);

  return (
    <div className="px-4 py-5 flex flex-col gap-6">
      <div>
        <p className="text-sm text-gray-400">{greeting},</p>
        <h2 className="text-2xl font-bold text-[#292D60]">{user?.firstName ?? "Ciudadano"}</h2>
      </div>

      <div className="rounded-2xl bg-[#292D60] px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-white font-semibold text-sm">¿Ves algo en tu ciudad?</p>
            <p className="text-[#D3D6FF]/70 text-xs mt-0.5">Reportalo y ayudá a resolverlo</p>
          </div>
        </div>
        <button
          onClick={onNuevoReporte}
          className="flex items-center justify-center gap-1.5 w-full md:w-auto md:shrink-0 px-4 py-2.5 rounded-xl bg-white text-[#292D60] text-sm font-bold hover:bg-[#D3D6FF] transition-colors"
        >
          <Plus size={15} />
          Cargar Incidente
        </button>
      </div>

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen</p>
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Últimos reportes
          </p>
          <button
            onClick={onVerTodos}
            className="text-xs text-[#3B418F] font-semibold flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={13} />
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
