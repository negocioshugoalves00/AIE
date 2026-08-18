import Link from "next/link";
import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

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

  const isGestor = perfil.role === "gestor";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-primary">Gestão de Exames</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/solicitacoes" className="text-slate-600 hover:text-slate-900">
                Solicitações
              </Link>
              {isGestor && (
                <Link href="/relatorios" className="text-slate-600 hover:text-slate-900">
                  Relatórios
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {perfil.nome}{" "}
              <span className="text-xs uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded ml-1">
                {perfil.role}
              </span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
