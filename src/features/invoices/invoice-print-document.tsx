import { formatDateShort } from "@/lib/format";
import { trimNumber, fmt } from "@/lib/helpers";
import type { InvoiceCompanyInfo, InvoiceDetail } from "./types";

export type { InvoiceCompanyInfo } from "./types";

const MAX_ROWS = 8;

export function InvoicePrintDocument({
  invoice,
  company,
}: {
  invoice: InvoiceDetail;
  company: InvoiceCompanyInfo;
}) {
  const extra = Number(invoice.extraCharges);

  const customerLocation = [
    invoice.customer.city,
    invoice.customer.state,
    invoice.customer.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const items = invoice.items.slice(0, MAX_ROWS);
  const emptyRows = MAX_ROWS - items.length;

  return (
    <div className="outer-box" id="invoice_page">
      <div className="bill-frame">
        <div className="flex-invoice">
          <div className="invoice">TAX INVOICE</div>
        </div>

        <div className="flex-heading">
          <div className="main-heading">
            <h1 style={{ fontWeight: "bold" }}>
              Soham Research &amp; Marketing Pvt. Ltd
            </h1>
            <p>
              {company.address ??
                "33/4, Sudarshan Apartment, Swapna Nagri, Garkheda Parisar,"}
            </p>
            <p>
              {company.city ?? "Chhatrapati Sambhajinagar"},{" "}
              {company.state ?? "Maharashtra"} - {company.pincode ?? "431003"}
            </p>
            <p>Mobile no. {company.phone ?? "9922127050 / 9850552856"}</p>
            <p>
              E-mail : {company.email ?? "proctotub@gmail.com"}, Website:{" "}
              {company.website ?? "www.proctositzbath.co.in"}
            </p>
            <p>GST No : {company.gstin ?? "2 7 A A N C S 2 1 6 7 G 1 Z 3"}</p>
          </div>
        </div>

        <div className="credentials-grid">
          <div className="buyer-details">
            <div>
              <b>To,</b>
            </div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                marginTop: "4px",
              }}
            >
              {invoice.customer.name}
            </div>
            <div>
              {invoice.customer.address ? `${invoice.customer.address}, ` : ""}
              {customerLocation}
            </div>
            <div style={{ marginTop: "auto" }}>
              <b>GST No : </b>
              <span>{invoice.customer.gstin ?? ""}</span>
            </div>
          </div>
          <div className="bill-details">
            <div className="box">
              <b>No. :</b>&nbsp;{invoice.invoiceNo}
            </div>
            <div className="box">
              <b>Date :</b>&nbsp;{formatDateShort(invoice.invoiceDate)}
            </div>
            <div className="box">
              <b>O. No. :</b>&nbsp;{invoice.orderNo ?? ""}
            </div>
            <div className="box">
              <b>O. Date :</b>&nbsp;
              {invoice.orderDate ? formatDateShort(invoice.orderDate) : ""}
            </div>
            <div className="box">
              <b>D.C. No. :</b>&nbsp;{invoice.dcNo ?? ""}
            </div>
            <div className="box">
              <b>D.C. Date :</b>&nbsp;
              {invoice.dcDate ? formatDateShort(invoice.dcDate) : ""}
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: "28%" }}>
                  Product description
                </th>
                <th rowSpan={2} style={{ width: "8%" }}>
                  HSN
                </th>
                <th rowSpan={2} style={{ width: "5%" }}>
                  Qty
                </th>
                <th rowSpan={2} style={{ width: "8%" }}>
                  Rate
                </th>
                <th rowSpan={2} style={{ width: "10%" }}>
                  Amount (₹)
                </th>
                <th colSpan={2} style={{ width: "10%" }}>
                  CGST
                </th>
                <th colSpan={2} style={{ width: "10%" }}>
                  SGST
                </th>
                <th colSpan={2} style={{ width: "10%" }}>
                  IGST
                </th>
                <th rowSpan={2} style={{ width: "11%" }}>
                  Total(₹)
                </th>
              </tr>
              <tr>
                <th>%</th>
                <th>Amt</th>
                <th>%</th>
                <th>Amt</th>
                <th>%</th>
                <th>Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const qty = Number(item.quantity);
                const rate = Number(item.unitPrice);
                const amt = qty * rate;
                const cAmt = Number(item.cgstAmount);
                const sAmt = Number(item.sgstAmount);
                const iAmt = Number(item.igstAmount);
                const rowTotal = amt + cAmt + sAmt + iAmt;

                return (
                  <tr key={item.id} className="product-row">
                    <td
                      style={{
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      {item.description}
                    </td>
                    <td>{item.hsn ?? ""}</td>
                    <td>{trimNumber(item.quantity)}</td>
                    <td>{fmt(item.unitPrice)}</td>
                    <td>{fmt(amt)}</td>
                    <td>
                      {Number(item.cgstRate) > 0
                        ? `${trimNumber(item.cgstRate)}%`
                        : ""}
                    </td>
                    <td>{cAmt > 0 ? fmt(cAmt) : ""}</td>
                    <td>
                      {Number(item.sgstRate) > 0
                        ? `${trimNumber(item.sgstRate)}%`
                        : ""}
                    </td>
                    <td>{sAmt > 0 ? fmt(sAmt) : ""}</td>
                    <td>
                      {Number(item.igstRate) > 0
                        ? `${trimNumber(item.igstRate)}%`
                        : ""}
                    </td>
                    <td>{iAmt > 0 ? fmt(iAmt) : ""}</td>
                    <td style={{ fontWeight: "bold" }}>{fmt(rowTotal)}</td>
                  </tr>
                );
              })}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <tr key={`empty-${i}`} className="product-row">
                  <td>&nbsp;</td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <th colSpan={4}>TOTAL</th>
                <td>{fmt(invoice.subTotal)}</td>
                <td colSpan={2}>{fmt(invoice.totalCgst)}</td>
                <td colSpan={2}>{fmt(invoice.totalSgst)}</td>
                <td colSpan={2}>{fmt(invoice.totalIgst)}</td>
                <td>{fmt(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="end-bill">
          <div className="amt-word">
            <b>Total Invoice Amount in Words</b>
            <br />
            <span style={{ textTransform: "capitalize", fontStyle: "italic" }}>
              {invoice.amountInWords}
            </span>
          </div>

          <div className="bank-details">
            <b>Bank Details</b>
            <br />
            <span style={{ fontSize: "11px" }}>
              Bank : Bank Of Baroda
              <br />
              Branch : Garkheda, Chhatrapati Sambhajinagar
              <br />
              A/c No : 27810200000322
              <br />
              IFSC : BARB0GARAUR
            </span>
          </div>

          <div className="assurance">
            <p style={{ margin: 0 }}>
              Received above mentioned goods in good condition.
            </p>
            <p style={{ marginTop: "20px" }}>
              <b>Receiver&apos;s Signature</b>
            </p>
          </div>

          <div className="amount-summary">
            <div className="summary-item">
              <span>Total Amount Before Tax</span>
              <span>₹ {fmt(invoice.subTotal)}</span>
            </div>
            <div className="summary-item">
              <span>CGST</span>
              <span>₹ {fmt(invoice.totalCgst)}</span>
            </div>
            <div className="summary-item">
              <span>SGST</span>
              <span>₹ {fmt(invoice.totalSgst)}</span>
            </div>
            <div className="summary-item">
              <span>IGST</span>
              <span>₹ {fmt(invoice.totalIgst)}</span>
            </div>
            {extra !== 0 ? (
              <div className="summary-item">
                <span>
                  {extra < 0
                    ? invoice.extraReason || "Discount"
                    : invoice.extraReason || "Extra Charges"}
                </span>
                <span>₹ {fmt(invoice.extraCharges)}</span>
              </div>
            ) : null}
            <div className="summary-item" style={{ fontSize: "13px" }}>
              <span>Total Amount After Tax</span>
              <span>₹ {fmt(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="footer">
          <div className="supply">
            Place Of Supply
            <br />
            <b>Chhatrapati Sambhajinagar (Maharashtra)</b>
          </div>
          <div className="from">
            For, <b>Soham Research &amp; Marketing Pvt. Ltd.</b>
            <br />
            <br />
            Authorized Signature
          </div>
        </div>
      </div>
    </div>
  );
}
