export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  invoiceCount: number;
  quotationCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerFilters = {
  cities: string[];
  states: string[];
};

export type CustomerListResult = {
  items: CustomerListItem[];
  filters: CustomerFilters;
  pagination: Pagination;
};

export type CustomerDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  invoiceCount: number;
  quotationCount: number;
  createdAt: string;
  updatedAt: string;
};
