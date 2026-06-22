import { useMemo } from "react";

const CLOSED = new Set(["resuelto", "rechazado", "cancelado"]);

export function useNotifications(incidents) {
  return useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const active = incidents.filter((i) => !i.isArchived);

    const emergencias = active.filter(
      (i) => i.is_emergency && !CLOSED.has(i.status?.name)
    );

    const criticos = active.filter(
      (i) => i.priority >= 7 && i.status?.name === "pendiente" && !i.is_emergency
    );

    const nuevosHoy = active.filter(
      (i) =>
        new Date(i.createdAt) >= todayStart &&
        i.status?.name === "pendiente" &&
        !i.is_emergency &&
        i.priority < 7
    );

    const total = emergencias.length + criticos.length + nuevosHoy.length;

    return { emergencias, criticos, nuevosHoy, total };
  }, [incidents]);
}
