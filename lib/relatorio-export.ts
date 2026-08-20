import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const NOMES_ACAO: Record<string, string> = {
  inclusao: "Inclusão",
  alteracao: "Alteração",
  exclusao: "Exclusão",
};

export type LinhaPorUnidade = {
  unidade: string;
  acao: string;
  total: number;
  finalizadas: number;
  pendentes: number;
  tempo_medio_minutos: number | null;
};

export type LinhaPorRecepcionista = {
  recepcionista: string;
  unidade: string;
  acao: string;
  total: number;
  finalizadas: number;
  pendentes: number;
};

function nomeArquivo(mesLabel: string, extensao: string) {
  return `relatorio-solicitacoes-${mesLabel}.${extensao}`;
}

/**
 * Gera uma planilha .xlsx com duas abas: totais por unidade e
 * o detalhamento por recepcionista. Tudo roda no navegador, não
 * precisa de servidor nem de instalar nada além da biblioteca.
 */
export function exportarExcel(
  porUnidade: LinhaPorUnidade[],
  porRecepcionista: LinhaPorRecepcionista[],
  mesReferencia: string, // ex: "2026-08"
  filtroUnidadeNome: string | null
) {
  const wb = XLSX.utils.book_new();

  const linhasResumo = [
    { Campo: "Mês de referência", Valor: mesReferencia },
    { Campo: "Filtro de unidade (quadro por recepcionista)", Valor: filtroUnidadeNome ?? "Todas" },
    { Campo: "Gerado em", Valor: new Date().toLocaleString("pt-BR") },
  ];
  const wsResumo = XLSX.utils.json_to_sheet(linhasResumo, { skipHeader: true });
  wsResumo["!cols"] = [{ wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  const linhasUnidade = porUnidade.map((r) => ({
    Unidade: r.unidade,
    Ação: NOMES_ACAO[r.acao] ?? r.acao,
    Total: r.total,
    Realizadas: r.finalizadas,
    Pendentes: r.pendentes,
    "Tempo médio (min)": r.tempo_medio_minutos ?? "",
  }));
  const wsUnidade = XLSX.utils.json_to_sheet(linhasUnidade);
  wsUnidade["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsUnidade, "Por unidade");

  const linhasRecepcionista = porRecepcionista.map((r) => ({
    Recepcionista: r.recepcionista,
    Unidade: r.unidade,
    Ação: NOMES_ACAO[r.acao] ?? r.acao,
    Total: r.total,
    Realizadas: r.finalizadas,
    Pendentes: r.pendentes,
  }));
  const wsRecepcionista = XLSX.utils.json_to_sheet(linhasRecepcionista);
  wsRecepcionista["!cols"] = [{ wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsRecepcionista, "Por recepcionista");

  XLSX.writeFile(wb, nomeArquivo(mesReferencia, "xlsx"));
}

/**
 * Gera um PDF com os mesmos dois quadros, formatados em tabela,
 * prontos para impressão ou envio por e-mail.
 */
export function exportarPDF(
  porUnidade: LinhaPorUnidade[],
  porRecepcionista: LinhaPorRecepcionista[],
  mesReferencia: string,
  mesLabelExtenso: string,
  filtroUnidadeNome: string | null
) {
  const doc = new jsPDF();
  const corPrimaria: [number, number, number] = [15, 118, 110];

  doc.setFontSize(15);
  doc.text("Relatório de Solicitações de Exames", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Referência: ${mesLabelExtenso}`, 14, 23);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 28);
  doc.setTextColor(0);

  doc.setFontSize(12);
  doc.text("Totais por unidade", 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [["Unidade", "Ação", "Total", "Realizadas", "Pendentes", "Tempo médio (min)"]],
    body: porUnidade.map((r) => [
      r.unidade,
      NOMES_ACAO[r.acao] ?? r.acao,
      String(r.total),
      String(r.finalizadas),
      String(r.pendentes),
      r.tempo_medio_minutos != null ? String(r.tempo_medio_minutos) : "-",
    ]),
    headStyles: { fillColor: corPrimaria },
    styles: { fontSize: 9 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 60;

  doc.setFontSize(12);
  doc.text(
    `Por recepcionista${filtroUnidadeNome ? ` — ${filtroUnidadeNome}` : ""}`,
    14,
    finalY + 12
  );

  autoTable(doc, {
    startY: finalY + 16,
    head: [["Recepcionista", "Unidade", "Ação", "Total", "Realizadas", "Pendentes"]],
    body: porRecepcionista.map((r) => [
      r.recepcionista,
      r.unidade,
      NOMES_ACAO[r.acao] ?? r.acao,
      String(r.total),
      String(r.finalizadas),
      String(r.pendentes),
    ]),
    headStyles: { fillColor: corPrimaria },
    styles: { fontSize: 9 },
  });

  doc.save(nomeArquivo(mesReferencia, "pdf"));
}
