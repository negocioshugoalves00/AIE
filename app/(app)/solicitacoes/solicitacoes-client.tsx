"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Opcao = { id: string; nome: string };

type Solicitacao = {
  id: string;
  numero_requisicao: string;
  nome_paciente: string;
  acao: "inclusao" | "alteracao" | "exclusao";
  status: "pendente" | "realizada";
  data_solicitacao: string;
  exame_texto_livre: string | null;
  recepcionista_nome: string | null;
  exames: { nome: string } | null;
  unidades: { nome: string } | null;
  convenios: { nome: string } | null;
  perfis: { nome: string } | null;
};

const ACOES: { valor: Solicitacao["acao"]; label: string }[] = [
  { valor: "inclusao", label: "Inclusão" },
  { valor: "alteracao", label: "Alteração" },
  { valor: "exclusao", label: "Exclusão" },
];

export default function SolicitacoesClient({
  unidadesIniciais,
  conveniosIniciais,
  solicitacoesIniciais,
}: {
  unidadesIniciais: Opcao[];
  conveniosIniciais: Opcao[];
  solicitacoesIniciais: Solicitacao[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [solicitacoes, setSolicitacoes] = useState(solicitacoesIniciais);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "realizada">("todos");

  const [form, setForm] = useState({
    numero_requisicao: "",
    nome_paciente: "",
    convenio_id: "",
    acao: "alteracao" as Solicitacao["acao"],
    exame_texto_livre: "",
    recepcionista_nome: "",
    unidade_id: "",
    observacao: "",
  });

  function atualizarCampo(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (
      !form.numero_requisicao ||
      !form.nome_paciente ||
      !form.unidade_id ||
      !form.exame_texto_livre ||
      !form.recepcionista_nome
    ) {
      setErro("Preencha número da requisição, paciente, exame, recepcionista e unidade.");
      return;
    }

    setEnviando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sessão expirada, faça login novamente.");
      setEnviando(false);
      return;
    }

    const { error } = await supabase.from("solicitacoes").insert({
      numero_requisicao: form.numero_requisicao,
      nome_paciente: form.nome_paciente,
      convenio_id: form.convenio_id || null,
      acao: form.acao,
      exame_texto_livre: form.exame_texto_livre,
      recepcionista_nome: form.recepcionista_nome,
      unidade_id: form.unidade_id,
      observacao: form.observacao || null,
      solicitante_id: user.id,
    });

    setEnviando(false);

    if (error) {
      setErro("Não foi possível salvar: " + error.message);
      return;
    }

    setForm({
      numero_requisicao: "",
      nome_paciente: "",
      convenio_id: "",
      acao: "alteracao",
      exame_texto_livre: "",
      recepcionista_nome: "",
      unidade_id: "",
      observacao: "",
    });

    router.refresh();
  }

  async function marcarComoRealizada(id: string) {
    const { error } = await supabase
      .from("solicitacoes")
      .update({ status: "realizada" })
      .eq("id", id);

    if (!error) {
      setSolicitacoes((atual) =>
        atual.map((s) => (s.id === id ? { ...s, status: "realizada" } : s))
      );
    }
  }

  const listaFiltrada =
    filtroStatus === "todos"
      ? solicitacoes
      : solicitacoes.filter((s) => s.status === filtroStatus);

  return (
    <div className="space-y-8">
      {/* Formulário */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Nova solicitação</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nº da requisição</label>
            <input
              value={form.numero_requisicao}
              onChange={(e) => atualizarCampo("numero_requisicao", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nome do paciente</label>
            <input
              value={form.nome_paciente}
              onChange={(e) => atualizarCampo("nome_paciente", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Convênio</label>
            <select
              value={form.convenio_id}
              onChange={(e) => atualizarCampo("convenio_id", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {conveniosIniciais.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ação</label>
            <select
              value={form.acao}
              onChange={(e) => atualizarCampo("acao", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {ACOES.map((a) => (
                <option key={a.valor} value={a.valor}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Exame</label>
            <input
              value={form.exame_texto_livre}
              onChange={(e) => atualizarCampo("exame_texto_livre", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nome do exame"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recepcionista</label>
            <input
              value={form.recepcionista_nome}
              onChange={(e) => atualizarCampo("recepcionista_nome", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nome de quem atendeu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unidade</label>
            <select
              value={form.unidade_id}
              onChange={(e) => atualizarCampo("unidade_id", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {unidadesIniciais.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Observação (opcional)</label>
            <input
              value={form.observacao}
              onChange={(e) => atualizarCampo("observacao", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {erro && <p className="text-sm text-red-600 md:col-span-3">{erro}</p>}

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={enviando}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-60"
            >
              {enviando ? "Salvando..." : "Salvar solicitação"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Solicitações recentes</h2>
          <div className="flex gap-2 text-sm">
            {(["todos", "pendente", "realizada"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFiltroStatus(v)}
                className={`px-3 py-1 rounded-full border ${
                  filtroStatus === v
                    ? "bg-primary text-white border-primary"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                {v === "todos" ? "Todos" : v === "pendente" ? "Pendentes" : "Realizadas"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Requisição</th>
                <th className="py-2 pr-3">Paciente</th>
                <th className="py-2 pr-3">Ação</th>
                <th className="py-2 pr-3">Exame</th>
                <th className="py-2 pr-3">Unidade</th>
                <th className="py-2 pr-3">Recepcionista</th>
                <th className="py-2 pr-3">Solicitante</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(s.data_solicitacao).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-2 pr-3">{s.numero_requisicao}</td>
                  <td className="py-2 pr-3">{s.nome_paciente}</td>
                  <td className="py-2 pr-3 capitalize">{s.acao}</td>
                  <td className="py-2 pr-3">{s.exames?.nome ?? s.exame_texto_livre}</td>
                  <td className="py-2 pr-3">{s.unidades?.nome}</td>
                  <td className="py-2 pr-3">{s.recepcionista_nome ?? "-"}</td>
                  <td className="py-2 pr-3">{s.perfis?.nome}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        s.status === "realizada"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {s.status === "realizada" ? "Realizada" : "Pendente"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {s.status === "pendente" && (
                      <button
                        onClick={() => marcarComoRealizada(s.id)}
                        className="text-primary hover:underline text-xs"
                      >
                        Marcar como realizada
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400">
                    Nenhuma solicitação encontrada.
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
