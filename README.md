# NEW BILLING — MERN App

A modern full-stack billing system built with MongoDB, Express, React (Vite), and Node.js.

## 🚀 First-Time Launch

Run the all-in-one startup script **(requires sudo for MongoDB socket fix)**:

```bash
cd /Users/sohamvaidya/Desktop/AC/New_billing/new_billing
chmod +x start.sh
./start.sh
```

Then open: **http://localhost:5173**

---

## 🔧 Manual Steps (if start.sh fails)

### 1. Fix MongoDB socket and start it

```bash
sudo rm -f /tmp/mongodb-27017.sock
mkdir -p ~/data/db
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongo.log
```

### 2. Seed the customer database (first time only)

```bash
cd server
npm run seed
```

### 3. Start the API server

```bash
cd server
npm start
# Runs on http://localhost:5000
```

### 4. Start the React client (new terminal)

```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## 📁 Project Structure

```
new_billing/
├── start.sh                  ← All-in-one launcher
├── server/
│   ├── index.js              ← Express entry point
│   ├── .env                  ← MONGO_URI + PORT
│   ├── seed.js               ← Seeds 26 customers from original app
│   ├── models/
│   │   ├── Customer.js
│   │   └── Bill.js
│   └── routes/
│       ├── customers.js      ← GET /api/customers?q=
│       └── bills.js          ← CRUD + analytics
└── client/
    └── src/
        ├── App.jsx           ← Routing
        ├── index.css         ← Dark theme design system
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── CustomerAutocomplete.jsx
        │   └── InvoiceTemplate.jsx  ← Pixel-perfect bill clone
        └── pages/
            ├── Dashboard.jsx       ← Stats + monthly chart
            ├── CreateBill.jsx      ← Full invoice form
            ├── PreviousBills.jsx   ← Search/filter bills
            └── BillPreview.jsx     ← View + PDF download
```

## ✨ Features

- **Smart Auto-Fill**: Type a buyer name → GST & address auto-populate from MongoDB
- **GST Calculations**: CGST/SGST/IGST auto-calculated per product row
- **Amount in Words**: Auto-converts total to Indian English words
- **PDF Generation**: jspdf + html2canvas, A4 portrait, exact original bill format
- **Analytics Dashboard**: Monthly revenue bar chart (Recharts)
- **Bill History**: Search by buyer name + date range filter
- **Mobile Responsive**: Collapsible sidebar, responsive grid layouts
