export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "VOID";

export type PaymentMethod =
  "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "CHEQUE";

export type InvoiceListItem = {
  id: string;
  invoiceNo: string;
  customer: { id: string; name: string };
  invoiceDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceListResult = {
  items: InvoiceListItem[];
  pagination: Pagination;
};

export type InvoiceItemDetail = {
  id: string;
  productId: string | null;
  productName: string | null;
  hsn: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  amount: string;
};

export type InvoiceDetail = {
  id: string;
  invoiceNo: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    gstin: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  };
  invoiceDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  extraCharges: string;
  extraReason: string | null;
  amountInWords: string;
  orderNo: string | null;
  orderDate: string | null;
  dcNo: string | null;
  dcDate: string | null;
  subTotal: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  cancelledAt: string | null;
  items: InvoiceItemDetail[];
  createdAt: string;
  updatedAt: string;
};

export type TimelineEntry = {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  metadata: Record<string, unknown> | null;
};

export type InvoiceCompanyInfo = {
  companyName: string;
  logoUrl: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
};

export type PaymentDetail = {
  id: string;
  amount: string;
  method: PaymentMethod;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  reference: string | null;
  note: string | null;
  paidAt: string;
  createdAt: string;
  user: { id: string; name: string };
};
