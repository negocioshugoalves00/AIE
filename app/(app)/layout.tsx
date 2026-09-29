import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/supabase/server";
import Sidebar from "./sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfilAtual();

  if (!perfil) {
    redirect("/login");
  }

  if (!perfil.ativo) {
    redirect("/login?motivo=inativo");
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar perfil={{ nome: perfil.nome, role: perfil.role }} />
      <main className="flex-1 min-w-0 px-8 py-6">{children}</main>
    </div>
  );
}
