import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    return { user: { email: "vinshare@2026", id: "default-user" } };
  },
  component: () => <Outlet />,
});
