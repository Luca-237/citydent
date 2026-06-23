import { useMemo } from "react";

const CLOSED = new Set(["resuelto", "rechazado", "cancelado"]);

export function useNotifications(incidents) {
  return useMemo(() => {
    const emergencias = incidents.filter(
      (i) => !i.isArchived && i.is_emergency && !CLOSED.has(i.status?.name)
    );
    return { emergencias, total: emergencias.length };
  }, [incidents]);
}
