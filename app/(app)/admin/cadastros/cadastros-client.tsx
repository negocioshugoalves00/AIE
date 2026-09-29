"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; nome: string; ativo: boolean };

function ListaCadastro({
  titulo,
  tabela,
  itensIniciais,
}: {
  titulo: string;
  tabela: "unidades" | "convenios";
  itensIniciais: Item[];
}) {
  const supabase = createClient();
  const [itens, setItens] = useState(itensIniciais);
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!novoNome.trim()) return;

    setSalvando(true);
    const { data, error } = await supabase
      .from(tabela)
      .insert({ nome: novoNome.trim() })
      .select("id, nome, ativo")
      .single();
    setSalvando(false);

    if (error) {
      setErro("Não foi possível adicionar: " + error.message);
      return;
    }

    setItens((atual) => [...atual, data as Item].sort((a, b) => a.nome.localeCompare(b.nome)));
    setNovoNome("");
  }

  async function alternarAtivo(item: Item) {
    const { error } = await supabase
      .from(tabela)
      .update({ ativo: !item.ativo })
      .eq("id", item.id);

    if (!error) {
      setItens((atual) =>
        atual.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i))
      );
    }
  }

  async function renomear(item: Item, novo: string) {
    if (!novo.trim() || novo === item.nome) return;
    const { error } = await supabase
      .from(tabela)
      .update({ nome: novo.trim() })
      .eq("id", item.id);

    if (!error) {
      setItens((atual) =>
        atual.map((i) => (i.id === item.id ? { ...i, nome: novo.trim() } : i))
      );
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="font-semibold mb-4">{titulo}</h2>

      <form onSubmit={adicionar} className="flex gap-2 mb-4">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder={`Novo(a) ${titulo.toLowerCase().replace(/s$/, "")}`}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={salvando}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}

      <ul className="divide-y divide-slate-100">
        {itens.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2 gap-3">
            <input
              defaultValue={item.nome}
              onBlur={(e) => renomear(item, e.target.value)}
              className={`flex-1 bg-transparent text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary ${
                item.ativo ? "" : "text-slate-400 line-through"
              }`}
            />
            <button
              onClick={() => alternarAtivo(item)}
              className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                item.ativo
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.ativo ? "Ativo" : "Inativo"}
            </button>
          </li>
        ))}
        {itens.length === 0 && (
          <li className="py-4 text-sm text-slate-400 text-center">Nenhum cadastro ainda.</li>
        )}
      </ul>
    </section>
  );
}

export default function CadastrosClient({
  unidadesIniciais,
  conveniosIniciais,
}: {
  unidadesIniciais: Item[];
  conveniosIniciais: Item[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Cadastros</h1>
        <p className="text-sm text-slate-500">
          Gerencie as unidades e convênios disponíveis no formulário de solicitações. Clique no
          nome para editar, ou no selo para ativar/desativar sem excluir o histórico.
        </p>
      </div>

      <ListaCadastro titulo="Unidades" tabela="unidades" itensIniciais={unidadesIniciais} />
      <ListaCadastro titulo="Convênios" tabela="convenios" itensIniciais={conveniosIniciais} />
    </div>
  );
}
