// Global type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "company_admin" | "leader" | "supervisor" | "employee";
  company_id: string;
  department_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  type: "general_climate" | "microclimate" | "organizational_culture";
  company_id: string;
  created_by: string;
  start_date: Date;
  end_date: Date;
  status: "draft" | "active" | "completed" | "archived";
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


