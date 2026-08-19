import { createClient, getPerfilAtual } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const NOMES_ACAO: Record<string, string> = {
  inclusao: "Inclusão",
  alteracao: "Alteração",
  exclusao: "Exclusão",
};

type LinhaPorUnidade = {
  unidade: string;
  acao: string;
  total: number;
  finalizadas: number;
  pendentes: number;
  tempo_medio_horas: number | null;
};

type LinhaPorRecepcionista = {
  recepcionista: string;
  unidade: string;
  total: number;
  finalizadas: number;
  pendentes: number;
};

export default async function RelatoriosPage() {
  const perfil = await getPerfilAtual();

  // Proteção no front — a proteção "de verdade" está na função do banco,
  // que recusa retornar dados para quem não é gestor.
  if (!perfil || perfil.role !== "gestor") {
    redirect("/solicitacoes");
  }

  const supabase = createClient();

  const [{ data: porUnidadeData, error: erro1 }, { data: porRecepcionistaData, error: erro2 }] =
    await Promise.all([
      supabase.rpc("relatorio_mensal"),
      supabase.rpc("relatorio_por_recepcionista"),
    ]);

  const porUnidade = (porUnidadeData ?? []) as LinhaPorUnidade[];
  const porRecepcionista = (porRecepcionistaData ?? []) as LinhaPorRecepcionista[];

  const totalMes = porUnidade.reduce((acc: number, r: LinhaPorUnidade) => acc + Number(r.total), 0);
  const totalPendentes = porUnidade.reduce(
    (acc: number, r: LinhaPorUnidade) => acc + Number(r.pendentes),
    0
  );
  const totalExclusoes = porUnidade
    .filter((r: LinhaPorUnidade) => r.acao === "exclusao")
    .reduce((acc: number, r: LinhaPorUnidade) => acc + Number(r.total), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Relatório do mês atual</h1>
        <p className="text-sm text-slate-500">
          Indicadores para acompanhamento e definição de treinamentos por unidade.
        </p>
      </div>

      {(erro1 || erro2) && (
        <p className="text-sm text-red-600">
          Não foi possível carregar o relatório. Verifique se seu usuário tem perfil de gestor.
        </p>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Total de solicitações no mês</p>
          <p className="text-3xl font-semibold mt-1">{totalMes}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Pendentes</p>
          <p className="text-3xl font-semibold mt-1 text-amber-600">{totalPendentes}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Exclusões no mês</p>
          <p className="text-3xl font-semibold mt-1 text-red-600">{totalExclusoes}</p>
          <p className="text-xs text-slate-400 mt-1">
            Exames lançados sem necessidade — vale olhar de perto.
          </p>
        </div>
      </div>

      {/* Por unidade / ação */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Por unidade e tipo de ação</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Unidade</th>
                <th className="py-2 pr-3">Ação</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Realizadas</th>
                <th className="py-2 pr-3">Pendentes</th>
                <th className="py-2 pr-3">Tempo médio (h)</th>
              </tr>
            </thead>
            <tbody>
              {porUnidade.map((r: LinhaPorUnidade, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{r.unidade}</td>
                  <td className="py-2 pr-3">{NOMES_ACAO[r.acao] ?? r.acao}</td>
                  <td className="py-2 pr-3">{r.total}</td>
                  <td className="py-2 pr-3">{r.finalizadas}</td>
                  <td className="py-2 pr-3">{r.pendentes}</td>
                  <td className="py-2 pr-3">{r.tempo_medio_horas ?? "-"}</td>
                </tr>
              ))}
              {porUnidade.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Sem solicitações neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Por recepcionista */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Por recepcionista</h2>
        <p className="text-xs text-slate-400 mb-4">
          Útil para identificar quem pode se beneficiar de um reforço de treinamento — o objetivo
          é reduzir erro, não punir.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Recepcionista</th>
                <th className="py-2 pr-3">Unidade</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Realizadas</th>
                <th className="py-2 pr-3">Pendentes</th>
              </tr>
            </thead>
            <tbody>
              {porRecepcionista.map((r: LinhaPorRecepcionista, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{r.recepcionista}</td>
                  <td className="py-2 pr-3">{r.unidade}</td>
                  <td className="py-2 pr-3">{r.total}</td>
                  <td className="py-2 pr-3">{r.finalizadas}</td>
                  <td className="py-2 pr-3">{r.pendentes}</td>
                </tr>
              ))}
              {porRecepcionista.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Sem solicitações neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
