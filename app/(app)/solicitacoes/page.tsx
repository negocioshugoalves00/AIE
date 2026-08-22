import { createClient } from "@/lib/supabase/server";
import SolicitacoesClient from "./solicitacoes-client";

export default async function SolicitacoesPage() {
  const supabase = createClient();

  const [{ data: unidades }, { data: convenios }, { data: solicitacoes }] = await Promise.all([
    supabase.from("unidades").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("convenios").select("id, nome").eq("ativo", true).order("nome"),
    supabase
      .from("solicitacoes")
      .select(
        "id, numero_requisicao, nome_paciente, acao, status, data_solicitacao, exame_texto_livre, recepcionista_nome, observacao, exames(nome), unidades(nome), convenios(nome), perfis!solicitacoes_solicitante_id_fkey(nome)"
      )
      .order("data_solicitacao", { ascending: false })
      .limit(100),
  ]);

  return (
    <SolicitacoesClient
      unidadesIniciais={unidades ?? []}
      conveniosIniciais={convenios ?? []}
      solicitacoesIniciais={(solicitacoes ?? []) as unknown as Parameters<typeof SolicitacoesClient>[0]["solicitacoesIniciais"]}
    />
  );
}
