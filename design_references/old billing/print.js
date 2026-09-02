document.addEventListener("DOMContentLoaded", function() {
    // 1. Retrieve Data
    const storedData = localStorage.getItem("invoiceData");
    if (!storedData) return;
    const data = JSON.parse(storedData);

    // 2. Helper to set text
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || "";
    }
    const fmt = (num) => (parseFloat(num) || 0).toFixed(2);

    // 3. Fill Header Info
    setText("to_name", data.to);
    setText("to_address", data.toAddress);
    setText("to_gst", data.gstNo);
    
    setText("b_no", data.billNo);
    setText("b_date", data.billDate);
    setText("o_no", data.orderNo);
    setText("o_date", data.orderDate);
    setText("d_no", data.dcNo); // D.C No
    // Note: D.C Date isn't in your screenshot layout, but we can map it if needed.

    // 4. Fill Totals
    setText("words_val", data.amountInWords);
    setText("t_btax", fmt(data.totalBeforeTax));
    setText("t_cgst", fmt(data.totalCGST));
    setText("t_sgst", fmt(data.totalSGST));
    setText("t_igst", fmt(data.totalIGST));
    setText("t_grand", fmt(data.totalAfterTax));

    // 5. Fill Summary Block (Right side bottom)
    setText("s_btax", fmt(data.totalBeforeTax));
    setText("s_cgst", fmt(data.totalCGST));
    setText("s_sgst", fmt(data.totalSGST));
    setText("s_igst", fmt(data.totalIGST));
    setText("s_atax", fmt(data.totalAfterTax));

    // 6. Extra Charges Logic (With Reason!)
    const extraAmt = parseFloat(data.extraCharges) || 0;
    const extraRow = document.getElementById("extra_row");
    
    if (extraAmt > 0) {
        extraRow.classList.remove("hidden");
        extraRow.classList.add("flex");
        // Display reason + amount
        const reason = data.extraReason ? `Add: ${data.extraReason}` : "Add: Extra Charges";
        document.getElementById("extra_label").textContent = reason;
        document.getElementById("s_extra").textContent = fmt(extraAmt);
    } else {
        extraRow.classList.add("hidden");
    }

    // 7. Generate Table Rows (Fixed Count for Visual Stability)
    const tbody = document.getElementById("productRows");
    const TOTAL_ROWS_TO_SHOW = 12; // Matches screenshot height roughly
    const products = data.products || [];

    for (let i = 0; i < TOTAL_ROWS_TO_SHOW; i++) {
        const tr = document.createElement("tr");
        tr.className = "h-8"; // Fixed row height

        // Border classes
        const br = "border-r border-black";
        const bb = "border-b border-black"; // Every row has a bottom border to match grid look
        
        if (products[i] && products[i].desc) {
            const p = products[i];
            const qty = parseFloat(p.qty) || 0;
            const rate = parseFloat(p.rate) || 0;
            const amt = qty * rate;
            const rowTotal = amt + (parseFloat(p.cgstAmt)||0) + (parseFloat(p.sgstAmt)||0) + (parseFloat(p.igstAmt)||0);

            tr.innerHTML = `
                <td class="${br} ${bb} text-left pl-2">${p.desc}</td>
                <td class="${br} ${bb}">${p.hsn || ""}</td>
                <td class="${br} ${bb}">${qty}</td>
                <td class="${br} ${bb}">${fmt(rate)}</td>
                <td class="${br} ${bb}">${fmt(amt)}</td>
                
                <td class="${br} ${bb} text-[10px]">${p.cgst ? fmt(p.cgst) : "0.00"}</td>
                <td class="${br} ${bb}">${fmt(p.cgstAmt)}</td>
                
                <td class="${br} ${bb} text-[10px]">${p.sgst ? fmt(p.sgst) : "0.00"}</td>
                <td class="${br} ${bb}">${fmt(p.sgstAmt)}</td>
                
                <td class="${br} ${bb} text-[10px]">${p.igst ? fmt(p.igst) : "0.00"}</td>
                <td class="${br} ${bb}">${fmt(p.igstAmt)}</td>
                
                <td class="${bb}">${fmt(rowTotal)}</td>
            `;
        } else {
            // Empty Row - Keeps the grid structure
            tr.innerHTML = `
                <td class="${br} ${bb}">&nbsp;</td>
                <td class="${br} ${bb}"></td>
                <td class="${br} ${bb}"></td>
                <td class="${br} ${bb}"></td>
                <td class="${br} ${bb}"></td>
                <td class="${br} ${bb}"></td><td class="${br} ${bb}"></td>
                <td class="${br} ${bb}"></td><td class="${br} ${bb}"></td>
                <td class="${br} ${bb}"></td><td class="${br} ${bb}"></td>
                <td class="${bb}"></td>
            `;
        }
        tbody.appendChild(tr);
    }
});

function downloadPDF() {
    const element = document.getElementById('invoice_page');
    const storedData = JSON.parse(localStorage.getItem("invoiceData"));
    const filename = `${storedData.billNo || "Invoice"}.pdf`;

    // Hide button
    document.querySelector('button').style.display = 'none';

    html2pdf(element, {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).then(() => {
        document.querySelector('button').style.display = 'block';
    });
}