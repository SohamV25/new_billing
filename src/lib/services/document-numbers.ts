import { prisma } from "@/lib/prisma";

export type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export function formatDocumentNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

async function nextDocumentNumber(
  tx: TransactionClient,
  kind: "invoice" | "quotation"
): Promise<string> {
  const settings = await tx.companySettings.findUnique({
    where: { id: "default" },
  });

  const prefix =
    kind === "invoice"
      ? (settings?.invoicePrefix ?? "INV")
      : (settings?.quotationPrefix ?? "QT");
  const sequence =
    kind === "invoice"
      ? (settings?.nextInvoiceNo ?? 1)
      : (settings?.nextQuotationNo ?? 1);

  if (settings) {
    await tx.companySettings.update({
      where: { id: "default" },
      data:
        kind === "invoice"
          ? { nextInvoiceNo: sequence + 1 }
          : { nextQuotationNo: sequence + 1 },
    });
  } else {
    await tx.companySettings.create({
      data:
        kind === "invoice"
          ? { invoicePrefix: prefix, nextInvoiceNo: sequence + 1 }
          : { quotationPrefix: prefix, nextQuotationNo: sequence + 1 },
    });
  }

  return formatDocumentNumber(prefix, sequence);
}

export async function nextInvoiceNumber(
  tx: TransactionClient
): Promise<string> {
  return nextDocumentNumber(tx, "invoice");
}

export async function nextQuotationNumber(
  tx: TransactionClient
): Promise<string> {
  return nextDocumentNumber(tx, "quotation");
}
