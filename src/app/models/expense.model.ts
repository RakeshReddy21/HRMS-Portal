export interface Expense {
    expenseId: number;
    employee: { employeeId: number; firstName: string; lastName: string; employeeCode: string; };
    title: string;
    description: string;
    category: string;
    totalAmount: number;
    currency: string;
    expenseDate: string;
    vendorName: string;
    invoiceNumber: string;
    receiptUrl: string;
    receiptFileName: string;
    status: ExpenseStatus;
    managerComments: string;
    financeComments: string;
    rejectionReason: string;
    submittedDate: string;
    reimbursedDate: string;
    items: ExpenseItem[];
    createdAt: string;
}

export interface ExpenseItem {
    itemId: number;
    description: string;
    amount: number;
    quantity: number;
}

export interface ExpenseRequest {
    title: string;
    description?: string;
    category: string;
    totalAmount: number;
    currency?: string;
    expenseDate: string;
    vendorName?: string;
    invoiceNumber?: string;
    receiptBase64?: string;
    receiptFileName?: string;
    items?: { description: string; amount: number; quantity?: number; }[];
}

export interface ExpenseActionRequest {
    action: string;
    comments?: string;
}

export interface InvoiceParseResponse {
    success: boolean;
    title: string;
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    currency: string;
    category: string;
    description: string;
    items: { description: string; amount: number; quantity: number; }[];
    rawText: string;
    errorMessage: string;
}

export interface LeaveAnalysisResponse {
    employeeName: string;
    department: string;
    designation: string;
    totalLeavesTakenThisYear: number;
    totalLeavesTakenLastYear: number;
    leavesByType: Record<string, number>;
    leavesByMonth: Record<string, number>;
    pendingLeaveRequests: number;
    averageLeaveDuration: number;
    currentBalances: Record<string, number>;
    patterns: string[];
    frequencyTrend: string;
    teamMembersOnLeaveToday: number;
    requestedDays: number;
    requestedType: string;
    balanceAfterApproval: number;
    aiSummary: string;
    aiRecommendation: string;
    aiReasons: string[];
}

export interface PerformanceReportResponse {
    employeeName: string;
    employeeCode: string;
    department: string;
    designation: string;
    reportPeriod: string;
    totalPresentDays: number;
    totalAbsentDays: number;
    lateArrivals: number;
    averageHoursPerDay: number;
    totalLeavesTaken: number;
    leaveBreakdown: Record<string, number>;
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    averageGoalProgress: number;
    goals: { title: string; status: string; progress: number; priority: string; }[];
    reviews: { period: string; selfRating: number; managerRating: number; status: string; }[];
    averageSelfRating: number;
    averageManagerRating: number;
    aiOverallAssessment: string;
    aiStrengths: string;
    aiAreasForImprovement: string;
    aiRecommendations: string;
    aiRating: string;
}

export type ExpenseStatus = 'DRAFT' | 'SUBMITTED' | 'MANAGER_APPROVED' | 'FINANCE_APPROVED' | 'REJECTED' | 'REIMBURSED';

export const EXPENSE_CATEGORIES = [
    'TRAVEL', 'MEALS', 'ACCOMMODATION', 'OFFICE_SUPPLIES', 'EQUIPMENT',
    'SOFTWARE', 'TRAINING', 'CLIENT_ENTERTAINMENT', 'COMMUNICATION',
    'MEDICAL', 'TRANSPORTATION', 'OTHER'
];

