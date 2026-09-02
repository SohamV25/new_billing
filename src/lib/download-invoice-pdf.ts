import html2pdf from "html2pdf.js";

export async function downloadInvoicePdf(
  element: HTMLElement,
  invoiceNo: string,
  receiverName: string
): Promise<void> {
  const safeReceiver = receiverName.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${invoiceNo}_${safeReceiver}.pdf`;

  const invoiceEl =
    element.querySelector<HTMLElement>("#invoice_page") ?? element;

  const w = invoiceEl.offsetWidth;
  const h = invoiceEl.offsetHeight;

  const opt = {
    margin: 0,
    filename,
    image: { type: "jpeg" as const, quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      width: w,
      height: h,
      windowWidth: w,
      windowHeight: h,
    },
    jsPDF: {
      unit: "px",
      format: [w, h] as [number, number],
      orientation: "portrait" as const,
      hotfixes: ["px_scaling"],
    },
    pagebreak: { mode: "avoid-all" },
  };

  await html2pdf().set(opt).from(invoiceEl).save();
}
