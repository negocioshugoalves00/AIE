import { createClient, getPerfilAtual } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CadastrosClient from "./cadastros-client";

export default async function AdminCadastrosPage() {
  const perfil = await getPerfilAtual();

  if (!perfil || perfil.role !== "gestor") {
    redirect("/solicitacoes");
  }

  const supabase = createClient();

  const [{ data: unidades }, { data: convenios }] = await Promise.all([
    supabase.from("unidades").select("id, nome, ativo").order("nome"),
    supabase.from("convenios").select("id, nome, ativo").order("nome"),
  ]);

  return (
    <CadastrosClient
      unidadesIniciais={unidades ?? []}
      conveniosIniciais={convenios ?? []}
    />
  );
}
