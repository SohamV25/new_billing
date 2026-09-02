export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type QuotationStatus =
  "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED";

export type QuotationListItem = {
  id: string;
  quotationNo: string;
  customer: { id: string; name: string };
  date: string;
  validUntil: string | null;
  status: QuotationStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
};

export type QuotationListResult = {
  items: QuotationListItem[];
  pagination: Pagination;
};

export type QuotationItemDetail = {
  id: string;
  productId: string | null;
  productName: string | null;
  hsn: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  amount: string;
};

export type QuotationDetail = {
  id: string;
  quotationNo: string;
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
  date: string;
  validUntil: string | null;
  status: QuotationStatus;
  storedStatus: QuotationStatus;
  notes: string | null;
  subTotal: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  totalAmount: string;
  items: QuotationItemDetail[];
  createdAt: string;
  updatedAt: string;
};

export type ConvertResult = {
  invoiceId: string;
  invoiceNo: string;
  quotationId: string;
};
