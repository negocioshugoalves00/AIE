import { createClient, getPerfilAtual } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsuariosClient from "./usuarios-client";

export default async function AdminUsuariosPage() {
  const perfil = await getPerfilAtual();

  if (!perfil || perfil.role !== "gestor") {
    redirect("/solicitacoes");
  }

  const supabase = createClient();

  const [{ data: usuarios }, { data: unidades }] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome, telefone, role, unidade_id, ativo, created_at")
      .order("nome"),
    supabase.from("unidades").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <UsuariosClient
      usuariosIniciais={usuarios ?? []}
      unidades={unidades ?? []}
      meuId={perfil.id}
    />
  );
}
