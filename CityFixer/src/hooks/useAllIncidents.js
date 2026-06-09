import { getAllIncidents } from "@/services/api";
import { useFetch } from "./useFetch";

export function useAllIncidents() {
  const { data: groups, ...rest } = useFetch(getAllIncidents, "groups");
  return { groups, ...rest };
}
