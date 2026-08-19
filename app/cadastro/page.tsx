"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraE164, paraEmailSintetico } from "@/lib/telefone";

type Unidade = { id: string; nome: string };

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase
      .from("unidades")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => setUnidades(data ?? []));
  }, [supabase]);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome || !telefone || !unidadeId || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signUp({
      email: paraEmailSintetico(telefone),
      password: senha,
      options: {
        data: {
          nome,
          telefone: paraE164(telefone),
          unidade_id: unidadeId,
        },
      },
    });

    setCarregando(false);

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setErro("Já existe uma conta com esse celular.");
      } else {
        setErro("Não foi possível criar a conta: " + error.message);
      }
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (sucesso) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Conta criada!</h1>
          <p className="text-sm text-slate-500">
            Redirecionando para a tela de login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold mb-1">Criar conta</h1>
        <p className="text-sm text-slate-500 mb-6">
          Cadastre seu acesso com seu celular. O gestor pode ajustar seu perfil depois.
        </p>

        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome completo</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Celular</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="(44) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unidade</label>
            <select
              value={unidadeId}
              onChange={(e) => setUnidadeId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md py-2 transition disabled:opacity-60"
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Já tem acesso?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
