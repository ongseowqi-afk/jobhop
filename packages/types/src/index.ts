export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface WorkerStats {
  shiftsCount: number;
  totalEarned: number;
  rating: number;
  showRate: number;
}

export interface ShiftSummary {
  id: string;
  jobTitle: string;
  clientName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  payRate: number;
  status: string;
}

export interface CommissionSummary {
  thisMonth: number;
  lastMonth: number;
  allTime: number;
  avgPerPlacement: number;
}
