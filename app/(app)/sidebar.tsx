"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  BarChart3,
  Building2,
  Users,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Perfil = {
  nome: string;
  role: "recepcionista" | "gestor";
};

const ITEM_CLASSES = (ativo: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    ativo
      ? "bg-primary/10 text-primary"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function Sidebar({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isGestor = perfil.role === "gestor";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-5 border-b border-slate-200">
        <span className="font-semibold text-primary">Gestão de Exames</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link href="/solicitacoes" className={ITEM_CLASSES(pathname.startsWith("/solicitacoes"))}>
          <ClipboardList size={18} />
          Solicitações
        </Link>

        {isGestor && (
          <>
            <Link href="/relatorios" className={ITEM_CLASSES(pathname.startsWith("/relatorios"))}>
              <BarChart3 size={18} />
              Relatórios
            </Link>
            <Link
              href="/admin/cadastros"
              className={ITEM_CLASSES(pathname.startsWith("/admin/cadastros"))}
            >
              <Building2 size={18} />
              Cadastros
            </Link>
            <Link
              href="/admin/usuarios"
              className={ITEM_CLASSES(pathname.startsWith("/admin/usuarios"))}
            >
              <Users size={18} />
              Usuários
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="text-sm mb-3">
          <p className="font-medium text-slate-900 truncate">{perfil.nome}</p>
          <span className="text-xs uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
            {perfil.role}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
