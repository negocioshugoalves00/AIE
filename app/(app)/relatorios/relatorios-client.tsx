"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NOMES_ACAO: Record<string, string> = {
  inclusao: "Inclusão",
  alteracao: "Alteração",
  exclusao: "Exclusão",
};

type Unidade = { id: string; nome: string };

type LinhaPorUnidade = {
  unidade: string;
  acao: string;
  total: number;
  finalizadas: number;
  pendentes: number;
  tempo_medio_minutos: number | null;
};

type LinhaPorRecepcionista = {
  recepcionista: string;
  unidade: string;
  acao: string;
  total: number;
  finalizadas: number;
  pendentes: number;
};

function mesAtualComoInput(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}`;
}

function nomeDoMes(mesInput: string): string {
  const [ano, mes] = mesInput.split("-").map(Number);
  const data = new Date(ano, mes - 1, 1);
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function RelatoriosClient({ unidades }: { unidades: Unidade[] }) {
  const supabase = createClient();

  const [mes, setMes] = useState(mesAtualComoInput());
  const [unidadeFiltro, setUnidadeFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [porUnidade, setPorUnidade] = useState<LinhaPorUnidade[]>([]);
  const [porRecepcionista, setPorRecepcionista] = useState<LinhaPorRecepcionista[]>([]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    const mesReferencia = `${mes}-01`;

    Promise.all([
      supabase.rpc("relatorio_mensal", { mes_referencia: mesReferencia }),
      supabase.rpc("relatorio_por_recepcionista", {
        mes_referencia: mesReferencia,
        unidade_filtro: unidadeFiltro || null,
      }),
    ]).then(([resUnidade, resRecepcionista]) => {
      if (cancelado) return;

      if (resUnidade.error || resRecepcionista.error) {
        setErro(
          "Não foi possível carregar o relatório. Verifique se seu usuário tem perfil de gestor."
        );
        setPorUnidade([]);
        setPorRecepcionista([]);
      } else {
        setPorUnidade((resUnidade.data ?? []) as LinhaPorUnidade[]);
        setPorRecepcionista((resRecepcionista.data ?? []) as LinhaPorRecepcionista[]);
      }
      setCarregando(false);
    });

    return () => {
      cancelado = true;
    };
  }, [mes, unidadeFiltro, supabase]);

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">
            Relatório de {nomeDoMes(mes)}
          </h1>
          <p className="text-sm text-slate-500">
            Indicadores para acompanhamento e definição de treinamentos por unidade.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Mês</label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Total de solicitações no mês</p>
          <p className="text-3xl font-semibold mt-1">{carregando ? "-" : totalMes}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Pendentes</p>
          <p className="text-3xl font-semibold mt-1 text-amber-600">
            {carregando ? "-" : totalPendentes}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">Exclusões no mês</p>
          <p className="text-3xl font-semibold mt-1 text-red-600">
            {carregando ? "-" : totalExclusoes}
          </p>
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
                <th className="py-2 pr-3">Tempo médio (min)</th>
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
                  <td className="py-2 pr-3">{r.tempo_medio_minutos ?? "-"}</td>
                </tr>
              ))}
              {!carregando && porUnidade.length === 0 && (
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold">Por recepcionista</h2>
            <p className="text-xs text-slate-400">
              Contabilizado pelo nome informado na solicitação — não por quem está logada
              registrando o pedido.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Unidade</label>
            <select
              value={unidadeFiltro}
              onChange={(e) => setUnidadeFiltro(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Recepcionista</th>
                <th className="py-2 pr-3">Unidade</th>
                <th className="py-2 pr-3">Ação</th>
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
                  <td className="py-2 pr-3">{NOMES_ACAO[r.acao] ?? r.acao}</td>
                  <td className="py-2 pr-3">{r.total}</td>
                  <td className="py-2 pr-3">{r.finalizadas}</td>
                  <td className="py-2 pr-3">{r.pendentes}</td>
                </tr>
              ))}
              {!carregando && porRecepcionista.length === 0 && (
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
    </div>
  );
}
