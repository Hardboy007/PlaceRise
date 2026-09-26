export function useIsReadOnly() {
  const subRole = localStorage.getItem("subRole");
  return subRole === "placement_coordinator";
}