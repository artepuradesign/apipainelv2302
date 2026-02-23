import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, FileText, FileDown, MessageCircle } from "lucide-react";
import { jsPDF } from "jspdf";

type SectionActionButtonsProps = {
  /** Returns the plain-text content used for copy/export/share */
  getText: () => string;
  /** Used for exported file names (without extension) */
  filenameBase: string;
  /** Optional PDF layout settings */
  pdf?: {
    headerTitle?: string;
    headerSubtitle?: string;
    footerLines?: string[];
  };
  /** Optional: override default toast messages */
  labels?: {
    copied?: string;
    exportedTxt?: string;
    exportedPdf?: string;
  };
};

const openExternalShare = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const downloadTxt = (text: string, filename: string) => {
  const element = document.createElement("a");
  const file = new Blob([text], { type: "text/plain; charset=utf-8" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const exportPdf = (
  text: string,
  filename: string,
  options?: SectionActionButtonsProps["pdf"]
) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Typography (built-in font, reliable)
  doc.setFont("helvetica", "normal");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 48;
  const headerH = 72;
  const footerH = 70;
  const contentTop = marginX + headerH;
  const contentBottom = pageHeight - marginX - footerH;
  const maxWidth = pageWidth - marginX * 2;

  const headerTitle = options?.headerTitle ?? "APIPAINEL.COM.BR";
  const headerSubtitle =
    options?.headerSubtitle ?? "Relatório Completo de Consulta CPF";
  const footerLines =
    options?.footerLines ??
    [
      "Este relatório contém informações confidenciais e deve ser tratado com segurança e de acordo com a LGPD.",
      `© ${new Date().getFullYear()} APIPAINEL.COM.BR — Todos os direitos reservados.`,
    ];

  const nowStr = new Date().toLocaleString("pt-BR");

  const addHeaderFooter = (pageNumber: number) => {
    // Header
    doc.setDrawColor(220);
    doc.setLineWidth(1);
    doc.line(marginX, marginX + 54, pageWidth - marginX, marginX + 54);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(headerTitle, marginX, marginX + 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(headerSubtitle, marginX, marginX + 40);

    doc.setFontSize(9);
    doc.text(nowStr, pageWidth - marginX, marginX + 22, { align: "right" });

    // Footer
    doc.setDrawColor(220);
    doc.line(
      marginX,
      pageHeight - marginX - 44,
      pageWidth - marginX,
      pageHeight - marginX - 44
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const footerText = footerLines.join("\n");
    const footerWrapped = doc.splitTextToSize(footerText, maxWidth);
    const footerStartY = pageHeight - marginX - 30;
    doc.text(footerWrapped, marginX, footerStartY);

    doc.setFontSize(9);
    doc.text(`Página ${pageNumber}`, pageWidth - marginX, pageHeight - marginX, {
      align: "right",
    });
  };

  // Prepare content
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const isSeparator = (line: string) => /^-+$/.test(line.trim());
  const isSectionTitle = (line: string) => {
    const t = line.trim();
    if (!t) return false;
    if (isSeparator(t)) return false;
    // Mostly uppercase, short-ish
    const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, "");
    if (letters.length < 6) return false;
    const upperRatio =
      letters.length === 0
        ? 0
        : letters
            .split("")
            .filter((c) => c === c.toUpperCase())
            .length / letters.length;
    return upperRatio > 0.9 && t.length <= 44;
  };

  const drawParagraph = (
    paragraph: string,
    x: number,
    y: number,
    fontSize: number
  ) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    const wrapped = doc.splitTextToSize(paragraph, maxWidth);
    doc.text(wrapped, x, y);
    return y + wrapped.length * (fontSize + 4);
  };

  let page = 1;
  addHeaderFooter(page);

  let cursorY = contentTop;
  const ensureSpace = (needed: number) => {
    if (cursorY + needed <= contentBottom) return;
    doc.addPage();
    page += 1;
    addHeaderFooter(page);
    cursorY = contentTop;
  };

  // Body
  rawLines.forEach((line) => {
    if (isSeparator(line)) return;

    if (isSectionTitle(line)) {
      ensureSpace(28);
      cursorY += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(line.trim(), marginX, cursorY);
      cursorY += 14;
      doc.setDrawColor(230);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 10;
      return;
    }

    // Label: value rows
    const idx = line.indexOf(":");
    if (idx > 0 && idx < 28) {
      const label = line.slice(0, idx + 1).trim();
      const value = line.slice(idx + 1).trim();
      ensureSpace(22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const labelW = doc.getTextWidth(label) + 6;
      doc.text(label, marginX, cursorY);

      doc.setFont("helvetica", "normal");
      const valueMaxW = Math.max(40, maxWidth - labelW);
      const wrappedVal = doc.splitTextToSize(value || "—", valueMaxW);
      doc.text(wrappedVal, marginX + labelW, cursorY);
      cursorY += wrappedVal.length * 14;
      return;
    }

    // Normal paragraph
    ensureSpace(22);
    cursorY = drawParagraph(line, marginX, cursorY, 10);
  });

  doc.save(filename);
};

const SectionActionButtons: React.FC<SectionActionButtonsProps> = ({
  getText,
  filenameBase,
  pdf,
  labels,
}) => {
  const onCopy = async () => {
    const text = getText();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(labels?.copied ?? "Dados copiados!");
  };

  const onExportTxt = () => {
    const text = getText();
    if (!text) return;
    downloadTxt(text, `${filenameBase}.txt`);
    toast.success(labels?.exportedTxt ?? "TXT exportado com sucesso!");
  };

  const onExportPdf = () => {
    const text = getText();
    if (!text) return;
    exportPdf(text, `${filenameBase}.pdf`, pdf);
    toast.success(labels?.exportedPdf ?? "PDF exportado com sucesso!");
  };

  const onShareWhatsApp = () => {
    const text = getText();
    if (!text) return;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    openExternalShare(url);
  };

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-md border bg-background shadow-sm"
      aria-label="Ações do relatório"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        className="h-8 w-8 rounded-none"
        title="Copiar"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onExportTxt}
        className="h-8 w-8 rounded-none border-l"
        title="Exportar TXT"
      >
        <FileText className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onExportPdf}
        className="h-8 w-8 rounded-none border-l"
        title="Exportar PDF"
      >
        <FileDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onShareWhatsApp}
        className="h-8 w-8 rounded-none border-l"
        title="Enviar no WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SectionActionButtons;
