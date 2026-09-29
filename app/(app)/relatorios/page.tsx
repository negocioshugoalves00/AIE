import { createClient, getPerfilAtual } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RelatoriosClient from "./relatorios-client";

export default async function RelatoriosPage() {
  const perfil = await getPerfilAtual();

  // Proteção no front — a proteção "de verdade" está na função do banco,
  // que recusa retornar dados para quem não é gestor.
  if (!perfil || perfil.role !== "gestor") {
    redirect("/solicitacoes");
  }

  const supabase = createClient();
  const { data: unidades } = await supabase
    .from("unidades")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  return <RelatoriosClient unidades={unidades ?? []} />;
}
