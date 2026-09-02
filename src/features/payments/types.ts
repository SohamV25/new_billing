export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type PaymentMethod =
  "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "CHEQUE";

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaymentListItem = {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customer: { id: string; name: string };
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paidAt: string;
  user: { id: string; name: string };
  createdAt: string;
};

export type PaymentListResult = {
  items: PaymentListItem[];
  pagination: Pagination;
};

export type PaymentListQuery = {
  search?: string;
  method?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};
