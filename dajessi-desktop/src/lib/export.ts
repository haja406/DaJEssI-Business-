import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export interface ExportColumn {
  header: string;
  accessor: string;
}

function getValue(row: Record<string, unknown>, accessor: string): string {
  const parts = accessor.split(".");
  let value: unknown = row;
  for (const part of parts) {
    if (value && typeof value === "object") value = (value as Record<string, unknown>)[part];
    else value = undefined;
  }
  return value === null || value === undefined ? "" : String(value);
}

export function exportToPdf(title: string, columns: ExportColumn[], rows: Record<string, unknown>[], fileName: string) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.setTextColor(31, 78, 61);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Exporté le ${new Intl.DateTimeFormat("fr-FR").format(new Date())} — DaJEssI Business`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => getValue(row, c.accessor))),
    headStyles: { fillColor: [31, 78, 61], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [234, 243, 238] },
    styles: { fontSize: 8, cellPadding: 3 },
    theme: "grid",
  });

  doc.save(`${fileName}.pdf`);
}

export async function exportToExcel(columns: ExportColumn[], rows: Record<string, unknown>[], fileName: string, sheetName = "Feuille1") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DaJEssI Business";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.accessor, width: Math.max(14, c.header.length + 4) }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E3D" } };

  rows.forEach((row) => {
    const record: Record<string, string> = {};
    columns.forEach((c) => { record[c.accessor] = getValue(row, c.accessor); });
    sheet.addRow(record);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printElement(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>Impression — DaJEssI Business</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #16241d; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #1F4E3D; color: white; }
          tr:nth-child(even) { background: #EAF3EE; }
          h1 { color: #1F4E3D; font-size: 18px; }
        </style>
      </head>
      <body>${el.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}
