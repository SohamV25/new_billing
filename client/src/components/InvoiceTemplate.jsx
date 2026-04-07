import React, { forwardRef } from 'react'

/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║  IMMUTABLE INVOICE TEMPLATE                              ║
 * ║  CSS & HTML are a strict 1:1 port of print.html          ║
 * ║  DO NOT alter any style property here                    ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const MAX_ROWS = 8

const InvoiceTemplate = forwardRef(function InvoiceTemplate({ data }, ref) {
  if (!data) return null

  const fmt  = v => (parseFloat(v) || 0).toFixed(2)
  const products = data.products || []
  const extra    = parseFloat(data.extraCharges) || 0

  const rows = []
  for (let i = 0; i < MAX_ROWS; i++) {
    const p = products[i] || null
    if (p && p.desc) {
      const qty      = parseFloat(p.qty)  || 0
      const rate     = parseFloat(p.rate) || 0
      const amt      = qty * rate
      const cAmt     = parseFloat(p.cgstAmt) || 0
      const sAmt     = parseFloat(p.sgstAmt) || 0
      const iAmt     = parseFloat(p.igstAmt) || 0
      const rowTotal = amt + cAmt + sAmt + iAmt
      rows.push(
        <tr key={i} className="inv-product-row">
          <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px' }}>{p.desc}</td>
          <td>{p.hsn || ''}</td>
          <td>{p.qty}</td>
          <td>{fmt(rate)}</td>
          <td>{fmt(amt)}</td>
          <td>{p.cgst ? p.cgst + '%' : ''}</td>
          <td>{p.cgstAmt || ''}</td>
          <td>{p.sgst ? p.sgst + '%' : ''}</td>
          <td>{p.sgstAmt || ''}</td>
          <td>{p.igst ? p.igst + '%' : ''}</td>
          <td>{p.igstAmt || ''}</td>
          <td style={{ fontWeight: 'bold' }}>{fmt(rowTotal)}</td>
        </tr>
      )
    } else {
      rows.push(
        <tr key={i} className="inv-product-row">
          <td>&nbsp;</td><td/><td/><td/><td/><td/><td/><td/><td/><td/><td/><td/>
        </tr>
      )
    }
  }

  return (
    <>
      {/* ─── Strict original print.html CSS ─── */}
      <style>{`
        .inv-outer-box {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background-color: white;
          color: black;
          display: flex;
          flex-direction: column;
          position: relative;
          padding: 8mm; /* Reduced padding slightly to ensure border fits */
          box-sizing: border-box;
        }
        .inv-bill-frame {
          border: 1px solid black;
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          font-family: "Times New Roman", Times, serif;
        }
        .inv-flex-invoice {
          display: flex;
          justify-content: center;
        }
        .inv-invoice-label {
          border-left: 1px solid black;
          border-right: 1px solid black;
          border-bottom: 1px solid black;
          padding: 2px 25px;
          font-weight: bold;
          font-size: 16px;
        }
        .inv-flex-heading {
          display: flex;
          justify-content: center;
          align-items: center;
          border-bottom: 1px solid black;
          padding: 8px 0;
        }
        .inv-main-heading { text-align: center; }
        .inv-main-heading h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .inv-main-heading p {
          margin: 1px 0;
          font-size: 12px;
          line-height: 1.1;
        }
        .inv-credentials-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          border-bottom: 1px solid black;
        }
        .inv-buyer-details {
          border-right: 1px solid black;
          padding: 8px 12px;
          font-size: 15px;
          min-height: 110px;
          display: flex;
          flex-direction: column;
        }
        .inv-bill-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .inv-bill-details .inv-box {
          border-bottom: 1px solid black;
          border-right: 1px solid black;
          padding: 6px 8px;
          font-size: 12px;
          display: flex;
          align-items: center;
        }
        .inv-bill-details .inv-box:nth-child(even) { border-right: 0; }
        .inv-bill-details .inv-box:nth-last-child(-n+2) { border-bottom: 0; }
        .inv-table-container {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-family: "Times New Roman", Times, serif;
        }
        .inv-table th, .inv-table td {
          border: 1px solid black;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 4px;
          word-wrap: break-word;
          line-height: 1.4;
          box-sizing: border-box;
        }
        .inv-table tr th:first-child, .inv-table tr td:first-child { border-left: none; }
        .inv-table tr th:last-child,  .inv-table tr td:last-child  { border-right: none; }
        .inv-table thead th {
          background-color: #f5f5f5;
          height: 25px;
        }
        .inv-product-row { height: 40px; }
        .inv-total-row th, .inv-total-row td {
          height: 25px;
          font-weight: bold;
          font-size: 13px;
          border-bottom: 1px solid black;
        }
        .inv-end-bill {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          grid-template-areas:
            "amt-word amt"
            "bank     amt"
            "assure   assure";
          border-top: 1px solid black;
          margin-top: -1px;
        }
        .inv-amt-word {
          grid-area: amt-word;
          border-right: 1px solid black;
          border-bottom: 1px solid black;
          padding: 10px;
          font-size: 12px;
          font-family: "Times New Roman", Times, serif;
        }
        .inv-bank-details {
          grid-area: bank;
          border-right: 1px solid black;
          padding: 10px;
          font-size: 12px;
          font-family: "Times New Roman", Times, serif;
        }
        .inv-assurance {
          grid-area: assure;
          border-top: 1px solid black;
          padding: 10px;
          font-size: 13px;
          font-weight: 500;
          font-family: "Times New Roman", Times, serif;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 70px;
        }
        .inv-amount-summary {
          grid-area: amt;
          display: flex;
          flex-direction: column;
        }
        .inv-summary-item {
          border-bottom: 1px solid black;
          font-size: 13px;
          font-weight: bold;
          font-family: "Times New Roman", Times, serif;
          display: grid;
          grid-template-columns: 1fr 120px;
          min-height: 25px;
          flex-grow: 1;
        }
        .inv-summary-item span:first-child {
          padding: 4px 10px;
          border-right: 1px solid black;
          display: flex;
          align-items: center;
        }
        .inv-summary-item span:last-child {
          padding: 4px 10px;
          text-align: right;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .inv-summary-item:last-child {
          border-bottom: 0;
          font-weight: bold;
          background-color: #eeeeee;
        }
        .inv-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid black;
          padding: 12px 16px;
          font-size: 15px;
          font-weight: bold;
          font-family: "Times New Roman", Times, serif;
          margin-bottom: auto; /* Push it to the bottom if there is space */
        }
        .inv-footer-right { text-align: right; }

        /* NEW: Prevent HSN column wrapping, fix width */
        .inv-table td:nth-child(2),
        .inv-table th:nth-child(2) {
          white-space: nowrap;
          min-width: 80px;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      {/* ─── Bill Structure ─── */}
      <div className="inv-outer-box" ref={ref} id="invoice_page">
        <div className="inv-bill-frame" id="invoice">

          {/* 1. Invoice label */}
          <div className="inv-flex-invoice">
            <div className="inv-invoice-label">TAX INVOICE</div>
          </div>

          {/* 2. Company header */}
          <div className="inv-flex-heading">
            <div className="inv-main-heading">
              <h1>Soham Research &amp; Marketing Pvt. Ltd</h1>
              <p>33/4, Sudarshan Apartment, Swapna Nagri, Garkheda Parisar,</p>
              <p>Chhatrapati Sambhajinagar, Maharashtra - 431003</p>
              <p>Mobile no. 9922127050 / 9850552856</p>
              <p>E-mail : proctotub@gmail.com, Website: www.proctositzbath.co.in</p>
              <p>GST No : 2 7 A A N C S 2 1 6 7 G 1 Z 3</p>
            </div>
          </div>

          {/* 3. Credentials grid */}
          <div className="inv-credentials-grid">
            <div className="inv-buyer-details">
              <div><b>To,</b></div>
              <div style={{ fontWeight:'bold', fontSize:16, marginTop:4 }}>{data.to}</div>
              <div>{data.toAddress}</div>
              <div style={{ marginTop:'auto' }}><b>GST No : </b>{data.gstNo}</div>
            </div>
            <div className="inv-bill-details">
              <div className="inv-box"><b>No. :</b>&nbsp;{data.billNo}</div>
              <div className="inv-box"><b>Date :</b>&nbsp;{data.billDate}</div>
              <div className="inv-box"><b>O. No. :</b>&nbsp;{data.orderNo}</div>
              <div className="inv-box"><b>O. Date :</b>&nbsp;{data.orderDate}</div>
              <div className="inv-box"><b>D.C. No. :</b>&nbsp;{data.dcNo}</div>
              <div className="inv-box"><b>D.C. Date :</b>&nbsp;{data.dcDate}</div>
            </div>
          </div>

          {/* 4. Product Table */}
          <div className="inv-table-container">
            <table className="inv-table">
              <thead>
                <tr>
                  <th rowSpan="2" style={{ width:'20%', fontSize: '15px' }}>Product description</th>
                  <th rowSpan="2" style={{ width:'12%'  }}>HSN</th>
                  <th rowSpan="2" style={{ width:'5%'  }}>Qty</th>
                  <th rowSpan="2" style={{ width:'8%'  }}>Rate</th>
                  <th rowSpan="2" style={{ width:'11%' }}>Amount (Rs)</th>
                  <th colSpan="2" style={{ width:'11%' }}>CGST</th>
                  <th colSpan="2" style={{ width:'11%' }}>SGST</th>
                  <th colSpan="2" style={{ width:'11%' }}>IGST</th>
                  <th rowSpan="2" style={{ width:'13%' }}>Total(Rs)</th>
                </tr>
                <tr>
                  <th>%</th><th>Amt</th>
                  <th>%</th><th>Amt</th>
                  <th>%</th><th>Amt</th>
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
              <tfoot>
                <tr className="inv-total-row">
                  <th colSpan="4">TOTAL</th>
                  <td>{fmt(data.totalBeforeTax)}</td>
                  <td colSpan="2">{fmt(data.totalCGST)}</td>
                  <td colSpan="2">{fmt(data.totalSGST)}</td>
                  <td colSpan="2">{fmt(data.totalIGST)}</td>
                  <td>{fmt(data.totalAfterTax)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 5. End-bill section */}
          <div className="inv-end-bill">
            <div className="inv-amt-word">
              <b>Total Invoice Amount in Words :</b><br />
              <span style={{ textTransform:'capitalize', fontStyle:'italic' }}>{data.amountInWords}</span>
            </div>

            <div className="inv-bank-details">
              <b style={{ textDecoration: 'underline' }}>Bank Details:</b>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', marginTop: 6, rowGap: 4, fontSize: 13, fontWeight: 'bold' }}>
                <div>Bank :</div><div>Bank Of Baroda</div>
                <div>Branch :</div><div>Garkheda, Chhatrapati Sambhajinagar</div>
                <div>A/c No :</div><div>27810200000322</div>
                <div>IFSC :</div><div>BARB0GARAUR</div>
              </div>
            </div>

            <div className="inv-assurance">
              <p style={{ margin: 0 }}>Received above mentioned goods in good condition.</p>
              <p style={{ marginTop: 20 }}><b>Receiver's Signature</b></p>
            </div>

            <div className="inv-amount-summary">
              <div className="inv-summary-item">
                <span>Total Amount Before Tax :</span>
                <span>Rs. {fmt(data.totalBeforeTax)}</span>
              </div>
              <div className="inv-summary-item">
                <span>CGST :</span>
                <span>Rs. {fmt(data.totalCGST)}</span>
              </div>
              <div className="inv-summary-item">
                <span>SGST :</span>
                <span>Rs. {fmt(data.totalSGST)}</span>
              </div>
              <div className="inv-summary-item">
                <span>IGST :</span>
                <span>Rs. {fmt(data.totalIGST)}</span>
              </div>
              {extra > 0 && (
                <div className="inv-summary-item">
                  <span>{data.extraReason ? data.extraReason + ' :' : 'Extra Charges :'}</span>
                  <span>Rs. {fmt(extra)}</span>
                </div>
              )}
              <div className="inv-summary-item">
                <span>Total Amount After Tax :</span>
                <span>Rs. {fmt(data.totalAfterTax)}</span>
              </div>
            </div>
          </div>

          {/* 6. Footer */}
          <div className="inv-footer">
            <div>
              Place Of Supply<br />
              <b>Chhatrapati Sambhajinagar (Maharashtra)</b>
            </div>
            <div className="inv-footer-right">
              For, <b>Soham Research &amp; Marketing Pvt. Ltd.</b><br /><br /><br />
              Authorized Signature
            </div>
          </div>

        </div>
      </div>
    </>
  )
})

export default InvoiceTemplate
