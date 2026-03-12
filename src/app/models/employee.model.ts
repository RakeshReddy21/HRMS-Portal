export interface EmployeeProfile{
    employeeId: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    departmentId: number;
    departmentName: string;
    designationId: number;
    designationTitle: string;
    twoFactorEnabled: boolean;
    joiningDate: string;
    salary: number;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    manager: ManagerInfo | null;
}
export interface ManagerInfo{
    managerId: number;
    managerCode: string;
    managerName: string;
    managerEmail: string;
    managerPhone: string;
}
export interface RegisterEmployeeRequest{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeCode?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    departmentId?: number;
    designationId?: number;
    joiningDate: string;
    salary?: number;
    managerCode?: string;
    role?: string;
}
export interface Department{
    departmentId: number;
    departmentName: string;
    description: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface Designation{
    designationId: number;
    designationName: string;
    description: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export interface PageResponse<T>{
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}