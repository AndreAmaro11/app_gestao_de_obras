import * as XLSX from "xlsx";

export interface ExcelColumn<T> {
  header: string;
  /** chave do objeto OU função para extrair o valor */
  accessor: keyof T | ((row: T) => any);
  /** Largura da coluna em caracteres */
  width?: number;
  /** Formato numérico Excel (ex: "R$ #,##0.00") */
  numFmt?: string;
}

/**
 * Exporta um array de objetos para um arquivo .xlsx.
 * - Aplica largura de colunas
 * - Negrita o cabeçalho
 * - Suporta acessores customizados
 */
export function exportToExcel<T>(
  rows: T[],
  columns: ExcelColumn<T>[],
  filename: string,
  sheetName: string = "Dados"
) {
  const safeRows = rows || [];
  const aoa: any[][] = [];

  // Header
  aoa.push(columns.map(c => c.header));

  // Body
  for (const row of safeRows) {
    aoa.push(
      columns.map(c => {
        const v = typeof c.accessor === "function" ? c.accessor(row) : (row as any)[c.accessor];
        if (v === null || v === undefined) return "";
        if (v instanceof Date) return v;
        return v;
      })
    );
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws["!cols"] = columns.map(c => ({ wch: c.width ?? Math.max(c.header.length + 2, 14) }));

  // Apply numeric formats and bold header
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  // Header bold
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[addr]) {
      ws[addr].s = { font: { bold: true } };
    }
  }
  // numFmt
  columns.forEach((col, idx) => {
    if (!col.numFmt) return;
    for (let R = 1; R <= range.e.r; ++R) {
      const addr = XLSX.utils.encode_cell({ r: R, c: idx });
      if (ws[addr] && typeof ws[addr].v === "number") {
        ws[addr].z = col.numFmt;
      }
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const cleanName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, cleanName);
}

/** Formata data ISO (YYYY-MM-DD) para BR sem timezone shift */
export const formatDateForExcel = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
};
