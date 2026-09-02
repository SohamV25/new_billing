document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("productBody");
  const addRowBtn = document.getElementById("addRow");
  const extraChargesInput = document.getElementById("extraCharges");
  const amountInWords = document.getElementById("amountInWords");

  // --- 1. DATA PREPARATION ---
  
  // Buyer data with proper casing and separated fields
  const buyerData = [
    { name: "Panchasheel Medical", address: "", city: "Chh.Sambhajinagar", gst: "27AAATD19998G1ZJ" },
    { name: "Rushikesh Medical", address: "", city: "Chh.Sambhajinagar", gst: "27ABEPH7135C1Z0" },
    { name: "Shivsai Medical", address: "", city: "Chh.Sambhajinagar", gst: "27ADIFS5838F1ZQ" },
    { name: "Sevenstar Hospital", address: "", city: "Nagpur", gst: "27AAECN5090N1ZY" },
    { name: "Andhra Hospital", address: "Eluru", city: "A. P.", gst: "37AAKCA2196A1ZU" },
    { name: "Bafna Surgicals", address: "", city: "Thane", gst: "27AAJFB1415F1ZV" },
    { name: "G. I. Pharma", address: "", city: "Ahmedabad", gst: "24AAPFG4330C1ZS" },
    { name: "Gem Hospital Coimbatore", address: "", city: "Tamilnadu", gst: "33AABCG8302P2ZH" },
    { name: "Niscco Agency", address: "", city: "Chh.Sambhajinagar", gst: "27AFTPA2739N1ZX" },
    { name: "Surya Hospital Pharmacy", address: "", city: "Pune", gst: "27AACCS9236M1ZT" },
    { name: "V R Medicare Pvt. Ltd", address: "", city: "", gst: "" },
    { name: "Zen Hospital", address: "", city: "Chembur", gst: "27AAECV2145E1ZJ" },
    { name: "Jyoti Nursing Home", address: "", city: "Jaipur", gst: "08AAGHJ2526N1Z2" },
    { name: "Bajaj Hospital", address: "", city: "Chh.Sambhajinagar", gst: "27AAATM6631K1ZD" },
    { name: "Psi Mkt. Pvt. Ltd.", address: "", city: "Nagpur", gst: "27AABCP1344E1ZT" },
    { name: "Kaizen Pharmacy", address: "", city: "Ahmedabad", gst: "24AADCG4824E2ZY" },
    { name: "Thaimedical", address: "Ballagundu", city: "Tamilnadu", gst: "33AWVPR8115N1ZO" },
    { name: "Jehangir Hospital", address: "", city: "Pune", gst: "" },
    { name: "Shivneri Swast Aushadhi", address: "", city: "", gst: "27ADUFS3097AIZP" },
    { name: "Jeevan Amrut Haematology Centre", address: "", city: "Chh.Sambhajinagar", gst: "27AOFPT2485K1ZC" },
    { name: "Mit Hospital And Research Institute", address: "", city: "Chh.Sambhajinagar", gst: "27AAATG2943C1Z1" },
    { name: "Sakthiwood Industries", address: "Mettupalayam", city: "Tamilnadu", gst: "33APGPK4730A1Z1" },
    { name: "Madhan Exports", address: "Erode", city: "Tamilnadu", gst: "33AIMPM6721E1ZD" },
    { name: "Ess Bee Surgicals", address: "", city: "Chandigarh", gst: "04AAHFE3708L1ZH" },
    { name: "Bajaj Life Care", address: "", city: "", gst: "27ABAPB1221D1ZP" },
    { name: "Jupiter Medical Equipments", address: "", city: "", gst: "33AACCV1534D1ZV" }
  ];

  const productLibrary = {
    "Procto Tub": { hsn: "94029090", price: "2500.00" },
    "Perianal support": { hsn: "90189099", price: "170.00" },
    "Perianal Cushion": { hsn: "90189099", price: "400.00" }
  };

  // --- 2. DYNAMIC DATALISTS (For Recommendation) ---

  function setupDatalists() {
    // Buyer Datalist
    const buyerList = document.createElement('datalist');
    buyerList.id = 'buyerSuggestions';
    buyerData.forEach(item => {
      let opt = document.createElement('option');
      opt.value = item.name;
      buyerList.appendChild(opt);
    });
    document.body.appendChild(buyerList);
    document.getElementById('to').setAttribute('list', 'buyerSuggestions');

    // Product Datalist
    const prodList = document.createElement('datalist');
    prodList.id = 'productSuggestions';
    Object.keys(productLibrary).forEach(name => {
      let opt = document.createElement('option');
      opt.value = name;
      prodList.appendChild(opt);
    });
    document.body.appendChild(prodList);
  }

  // --- 3. UTILITY FUNCTIONS ---

  function parse(val) {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  function numberToWords(num) {
    const a = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    function convertToWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      if (n < 1000) return a[Math.floor(n / 100)] + " hundred" + (n % 100 ? " and " + convertToWords(n % 100) : "");
      if (n < 100000) return convertToWords(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + convertToWords(n % 1000) : "");
      if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + " lakh" + (n % 100000 ? " " + convertToWords(n % 100000) : "");
      return "too large";
    }
    return convertToWords(num).replace(/^./, c => c.toUpperCase());
  }

  function setTodayDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const formatted = `${dd}/${mm}/${yyyy}`;
    
    // Set ONLY to bill date input
    const billDateEl = document.getElementById('billDate');
    if (billDateEl) billDateEl.value = formatted;
  }

  // --- 4. CALCULATIONS & AUTO-FILL ---

  function calculateTotals() {
    let totalBeforeTax = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const rows = tableBody.querySelectorAll("tr");
    rows.forEach(row => {
      const qty = parse(row.querySelector(".qty")?.value);
      const rate = parse(row.querySelector(".rate")?.value);
      const cgst = parse(row.querySelector(".cgst")?.value);
      const sgst = parse(row.querySelector(".sgst")?.value);
      const igst = parse(row.querySelector(".igst")?.value);

      const baseAmount = qty * rate;
      const cgstAmt = (baseAmount * cgst) / 100;
      const sgstAmt = (baseAmount * sgst) / 100;
      const igstAmt = (baseAmount * igst) / 100;

      row.querySelector(".cgstAmt").value = cgstAmt.toFixed(2);
      row.querySelector(".sgstAmt").value = sgstAmt.toFixed(2);
      row.querySelector(".igstAmt").value = igstAmt.toFixed(2);

      totalBeforeTax += baseAmount;
      totalCGST += cgstAmt;
      totalSGST += sgstAmt;
      totalIGST += igstAmt;
    });

    const extraCharges = parse(extraChargesInput.value);
    const totalAfterTax = totalBeforeTax + totalCGST + totalSGST + totalIGST + extraCharges;

    document.getElementById("totalBeforeTax").value = totalBeforeTax.toFixed(2);
    document.getElementById("totalCGST").value = totalCGST.toFixed(2);
    document.getElementById("totalSGST").value = totalSGST.toFixed(2);
    document.getElementById("totalIGST").value = totalIGST.toFixed(2);
    document.getElementById("totalAfterTax").value = totalAfterTax.toFixed(2);

    if(totalAfterTax > 0) {
        amountInWords.value = numberToWords(Math.round(totalAfterTax)) + " only";
    } else {
        amountInWords.value = "";
    }
  }

  // --- 5. EVENT LISTENERS ---

  // Buyer Autocomplete Event
  document.getElementById('to').addEventListener('input', function(e) {
    const selection = buyerData.find(item => item.name === e.target.value);
    if (selection) {
      document.getElementById('gstNo').value = selection.gst;
      document.getElementById('toAddress').value = selection.address;
      
      // If you add an input with id="toCity", it will populate here
      const cityField = document.getElementById('toCity');
      if (cityField) cityField.value = selection.city;
    }
  });

  // Table Delegation (Calculations + Product Auto-fill)
  tableBody.addEventListener("input", function(e) {
    if (e.target.classList.contains('desc')) {
      const prod = productLibrary[e.target.value];
      if (prod) {
        const row = e.target.closest('tr');
        row.querySelector('.hsn').value = prod.hsn;
        row.querySelector('.rate').value = prod.price;
      }
    }
    calculateTotals();
  });

  // Add Row
  addRowBtn.addEventListener("click", () => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" class="form-control desc" list="productSuggestions"></td>
      <td><input type="text" class="form-control hsn"></td>
      <td><input type="text" class="form-control qty"></td>
      <td><input type="text" class="form-control rate"></td>
      <td><input type="text" class="form-control cgst"></td>
      <td><input type="text" class="form-control cgstAmt" readonly></td>
      <td><input type="text" class="form-control sgst"></td>
      <td><input type="text" class="form-control sgstAmt" readonly></td>
      <td><input type="text" class="form-control igst"></td>
      <td><input type="text" class="form-control igstAmt" readonly></td>
      <td><i class="bi bi-x-square-fill text-danger fs-5 deleteRow" role="button"></i></td>
    `;
    tableBody.appendChild(row);
  });

  // Delete Row
  tableBody.addEventListener("click", function (e) {
    if (e.target.classList.contains("deleteRow")) {
      e.target.closest("tr").remove();
      calculateTotals();
    }
  });

  extraChargesInput.addEventListener("input", calculateTotals);

  // --- 6. PRINT LOGIC ---

  const printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      const data = {
        to: document.getElementById("to").value,
        toAddress: document.getElementById("toAddress").value,
        toCity: document.getElementById("toCity") ? document.getElementById("toCity").value : "",
        gstNo: document.getElementById("gstNo").value,
        billNo: document.getElementById("billNo").value,
        billDate: document.getElementById("billDate").value,
        orderNo: document.getElementById("orderNo").value,
        orderDate: document.getElementById("orderDate").value,
        dcNo: document.getElementById("dcNo").value,
        dcDate: document.getElementById("dcDate").value,
        extraReason: document.getElementById("extraReason").value,
        extraCharges: document.getElementById("extraCharges").value,
        amountInWords: document.getElementById("amountInWords").value,
        totalBeforeTax: document.getElementById("totalBeforeTax").value,
        totalCGST: document.getElementById("totalCGST").value,
        totalSGST: document.getElementById("totalSGST").value,
        totalIGST: document.getElementById("totalIGST").value,
        totalAfterTax: document.getElementById("totalAfterTax").value,
        products: [],
      };

      const rows = document.querySelectorAll("#productBody tr");
      rows.forEach(row => {
        data.products.push({
          desc: row.querySelector(".desc").value,
          hsn: row.querySelector(".hsn").value,
          qty: row.querySelector(".qty").value,
          rate: row.querySelector(".rate").value,
          cgst: row.querySelector(".cgst").value,
          cgstAmt: row.querySelector(".cgstAmt").value,
          sgst: row.querySelector(".sgst").value,
          sgstAmt: row.querySelector(".sgstAmt").value,
          igst: row.querySelector(".igst").value,
          igstAmt: row.querySelector(".igstAmt").value,
        });
      });

      localStorage.setItem("invoiceData", JSON.stringify(data));
      window.open("print.html", "_blank");
    });
  }

  setupDatalists();
  setTodayDate();
  const firstDesc = tableBody.querySelector('.desc');
  if(firstDesc) firstDesc.setAttribute('list', 'productSuggestions');
});