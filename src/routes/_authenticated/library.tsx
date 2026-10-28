import { createFileRoute, redirect } from "@tanstack/react-router";

// Replaced by the Atlas (categories → subdivisions → operations / conditions). Old links land on Home.
export const Route = createFileRoute("/_authenticated/library")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
