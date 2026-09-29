"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { paraEmailSintetico } from "@/lib/telefone";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: paraEmailSintetico(telefone),
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("Celular ou senha inválidos.");
      return;
    }

    router.refresh();
    router.push("/solicitacoes");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold mb-1">Gestão de Solicitações</h1>
        <p className="text-sm text-slate-500 mb-6">
          Entre com seu celular e senha cadastrados.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Celular</label>
            <input
              type="tel"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="(44) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md py-2 transition disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Ainda não tem acesso?{" "}
          <Link href="/cadastro" className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
