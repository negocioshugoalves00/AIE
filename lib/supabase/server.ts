import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component sem permissão de escrita.
            // Pode ser ignorado se houver middleware atualizando a sessão.
          }
        },
      },
    }
  );
}

/**
 * Busca o perfil (nome, role, unidade) do usuário logado.
 * Use em Server Components para decidir o que renderizar.
 */
export async function getPerfilAtual() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome, role, unidade_id, ativo")
    .eq("id", user.id)
    .single();

  return perfil;
}
