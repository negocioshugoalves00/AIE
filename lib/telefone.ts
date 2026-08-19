/**
 * Converte um número de celular digitado em qualquer formato comum no Brasil
 * (com ou sem DDD, com ou sem parênteses/traço, com ou sem +55) para o
 * formato E.164 usado para exibição/armazenamento, ex: "+5544999998888".
 */
export function paraE164(telefone: string): string {
  const apenasDigitos = telefone.replace(/\D/g, "");

  if (apenasDigitos.length === 13 && apenasDigitos.startsWith("55")) {
    return `+${apenasDigitos}`;
  }

  if (apenasDigitos.length === 11) {
    return `+55${apenasDigitos}`;
  }

  return apenasDigitos.startsWith("+") ? telefone : `+${apenasDigitos}`;
}

/**
 * Gera um "e-mail" sintético a partir do celular, usado apenas como
 * identificador interno para o Supabase Auth (que exige e-mail/senha).
 * A pessoa nunca vê nem digita esse valor — só o celular.
 * Isso evita depender de um provedor de SMS pago (Twilio etc.) para
 * ativar login por telefone no Supabase.
 */
export function paraEmailSintetico(telefone: string): string {
  const digitos = paraE164(telefone).replace(/\D/g, "");
  return `${digitos}@celular.gestao-exames.interno`;
}

/**
 * Formata um número E.164 para exibição amigável, ex: "+5544999998888" -> "(44) 99999-8888"
 */
export function paraExibicao(telefoneE164: string | null): string {
  if (!telefoneE164) return "-";
  const digitos = telefoneE164.replace(/\D/g, "").replace(/^55/, "");
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  return telefoneE164;
}
