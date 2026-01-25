export interface Agent {
  _id: string;
  phone: string;
  name: string;
  location: string;
  level: 'bronze' | 'silver' | 'gold';
  balance: number;
  transactions: number;
  createdAt: Date;
}

export interface TransactionRequest {
  type: 'cashin' | 'cashout';
  amount: number;
  customerPhone: string;
}

export interface LoanRequest {
  amount: number;
  customerPhone: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
