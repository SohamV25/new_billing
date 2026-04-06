import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import InvoiceTemplate from '../components/InvoiceTemplate'

const API = 'http://localhost:5001'

export default function BillPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bill, setBill]       = useState(null)
  const [loading, setLoading] = useState(true)
  const templateRef = useRef(null)

  useEffect(() => {
    axios.get(`${API}/api/bills/${id}`)
      .then(r => setBill(r.data))
      .catch(() => alert('Bill not found'))
      .finally(() => setLoading(false))
  }, [id])

  function downloadPDF() {
    if (!bill) return;

    // Save the bill data to localStorage exactly like the old_bill project does
    const invoiceData = {
      to: bill.to || '',
      toAddress: bill.toAddress || '',
      gstNo: bill.gstNo || '',
      billNo: bill.billNo || '',
      billDate: bill.billDate || '',
      orderNo: bill.orderNo || '',
      orderDate: bill.orderDate || '',
      dcNo: bill.dcNo || '',
      dcDate: bill.dcDate || '',
      amountInWords: bill.amountInWords || '',
      totalBeforeTax: bill.totalBeforeTax || '0',
      totalCGST: bill.totalCGST || '0',
      totalSGST: bill.totalSGST || '0',
      totalIGST: bill.totalIGST || '0',
      totalAfterTax: bill.totalAfterTax || '0',
      extraCharges: bill.extraCharges || '0',
      extraReason: bill.extraReason || '',
      products: (bill.products || []).map(p => ({
        desc: p.desc || '',
        hsn: p.hsn || '',
        qty: p.qty || 0,
        rate: p.rate || 0,
        cgst: p.cgst || '',
        cgstAmt: p.cgstAmt || '0',
        sgst: p.sgst || '',
        sgstAmt: p.sgstAmt || '0',
        igst: p.igst || '',
        igstAmt: p.igstAmt || '0',
      }))
    };

    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));

    // Open the standalone print.html page in a new tab
    // This is the EXACT same approach as old_bill project
    window.open('/print.html', '_blank');
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:80, color:'var(--text-dim)' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
      <p>Loading bill...</p>
    </div>
  )

  if (!bill) return (
    <div className="empty-state">
      <div className="empty-icon">❌</div>
      <p>Bill not found.</p>
    </div>
  )

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'center', flexWrap:'wrap' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/bills')}>← Back to Bills</button>
        <button className="btn btn-primary" onClick={() => navigate('/create')}>➕ New Bill</button>
        <button className="btn btn-success" onClick={downloadPDF}>
          📥 Download PDF
        </button>
        <div style={{ marginLeft:'auto', color:'var(--text-dim)', fontSize:12 }}>
          Bill #{bill.billNo || '—'} · {bill.to} · ₹{bill.totalAfterTax}
        </div>
      </div>

      {/* Invoice preview — scrollable on small screens */}
      <div style={{ overflowX:'auto', background:'#e5e5e5', padding:20, borderRadius:12 }}>
        <InvoiceTemplate data={bill} ref={templateRef} />
      </div>
    </div>
  )
}
