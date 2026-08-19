"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { paraExibicao } from "@/lib/telefone";

type Unidade = { id: string; nome: string };

type Usuario = {
  id: string;
  nome: string;
  telefone: string | null;
  role: "recepcionista" | "gestor";
  unidade_id: string | null;
  ativo: boolean;
  created_at: string;
};

export default function UsuariosClient({
  usuariosIniciais,
  unidades,
  meuId,
}: {
  usuariosIniciais: Usuario[];
  unidades: Unidade[];
  meuId: string;
}) {
  const supabase = createClient();
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [erroPorId, setErroPorId] = useState<Record<string, string>>({});

  async function atualizar(id: string, campos: Partial<Usuario>) {
    setErroPorId((atual) => ({ ...atual, [id]: "" }));

    const { error } = await supabase.from("perfis").update(campos).eq("id", id);

    if (error) {
      setErroPorId((atual) => ({
        ...atual,
        [id]: "Não foi possível salvar essa alteração.",
      }));
      return;
    }

    setUsuarios((atual) =>
      atual.map((u) => (u.id === id ? { ...u, ...campos } : u))
    );
  }

  function nomeUnidade(id: string | null) {
    return unidades.find((u) => u.id === id)?.nome ?? "-";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Usuários</h1>
        <p className="text-sm text-slate-500">
          Veja todos os cadastros e ajuste papel, unidade e status de acesso. Novos cadastros
          entram automaticamente como "recepcionista" — promova para "gestor" quem deve ver os
          relatórios.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">Celular</th>
                <th className="py-2 pr-3">Unidade</th>
                <th className="py-2 pr-3">Papel</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3">
                    {u.nome}
                    {u.id === meuId && (
                      <span className="text-xs text-slate-400 ml-1">(você)</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">{paraExibicao(u.telefone)}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={u.unidade_id ?? ""}
                      onChange={(e) => atualizar(u.id, { unidade_id: e.target.value || null })}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="">-- sem unidade --</option>
                      {unidades.map((un) => (
                        <option key={un.id} value={un.id}>
                          {un.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={u.role}
                      disabled={u.id === meuId}
                      onChange={(e) =>
                        atualizar(u.id, { role: e.target.value as Usuario["role"] })
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
                    >
                      <option value="recepcionista">Recepcionista</option>
                      <option value="gestor">Gestor</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      disabled={u.id === meuId}
                      onClick={() => atualizar(u.id, { ativo: !u.ativo })}
                      className={`text-xs px-2 py-1 rounded-full disabled:opacity-50 ${
                        u.ativo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.ativo ? "Ativo" : "Bloqueado"}
                    </button>
                    {erroPorId[u.id] && (
                      <p className="text-xs text-red-600 mt-1">{erroPorId[u.id]}</p>
                    )}
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Nenhum usuário cadastrado ainda.
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
