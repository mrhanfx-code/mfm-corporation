import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command Center — MFM Corp",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {children}
    </div>
  );
}
