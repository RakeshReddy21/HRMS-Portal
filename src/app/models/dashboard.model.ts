export interface DashboardResponse {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    totalManagers: number;
    totalAdmins: number;
    totalRegularEmployees: number;
    pendingLeaves: number;
    approvedLeavesToday: number;
    totalDepartments: number;
    totalDesignations: number;
    employeesByDepartment: Record<string, number>;
}

export interface EmployeeReportResponse {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    headcountByDepartment: Record<string, number>;
    headcountByRole: Record<string, number>;
    joiningTrends: JoiningTrend[];
    averageTenureMonths: number;
}

export interface JoiningTrend {
    period: string;
    count: number;
}

export interface Holiday {
    holidayId: number;
    holidayName: string;
    holidayDate: string;
    description: string;
    year: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Announcement {
    announcementId: number;
    title: string;
    content: string;
    priority: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    createdBy?: {
        employeeId?: number;
        firstName: string;
        lastName: string;
    };
}

export interface LeaveType {
    leaveTypeId: number;
    leaveTypeName: string;
    description: string;
    defaultDays: number;
    isPaidLeave: boolean;
    isCarryForwardEnabled: boolean;
    maxCarryForwardDays: number;
    isLossOfPay: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface LeaveTypeRequest {
    leaveTypeName: string;
    description?: string;
    defaultDays: number;
    isPaidLeave?: boolean;
    isCarryForwardEnabled?: boolean;
    maxCarryForwardDays?: number;
    isLossOfPay?: boolean;
}

export interface HolidayRequest {
    holidayName: string;
    holidayDate: string;
    description?: string;
}

export interface AnnouncementRequest {
    title: string;
    content: string;
}

export interface DepartmentRequest {
    departmentName: string;
    description?: string;
}

export interface DesignationRequest {
    designationName: string;
    description?: string;
}

export interface LeaveApplication {
    leaveId: number;
    employee: {
        firstName: string;
        lastName: string;
        employeeCode: string;
        department?: {
            departmentName: string;
        };
    };
    leaveType: {
        leaveTypeName: string;
    };
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
    appliedDate: string;
}

export interface AttendanceRecord {
    attendanceId: number;
    employeeId: number;
    employeeCode: string;
    employeeName: string;
    attendanceDate: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalHours: number | null;
    status: string;
    checkInIp: string | null;
    checkOutIp: string | null;
    notes: string | null;
    isLate: boolean;
    isEarlyDeparture: boolean;
    createdAt: string;
}

export interface AttendanceSummary {
    employeeCode: string;
    employeeName: string;
    totalPresent: number;
    totalAbsent: number;
    totalHalfDay: number;
    totalOnLeave: number;
    totalLateArrivals: number;
    totalEarlyDepartures: number;
    totalHoursWorked: number;
    month: string;
    year: number;
}

export interface EmployeeDashboardResponse {
    employeeName: string;
    employeeCode: string;
    departmentName: string;
    designationTitle: string;
    pendingLeaveRequests: number;
    approvedLeaves: number;
    unreadNotifications: number;
    leaveBalances: LeaveBalanceSummary[];
    upcomingHolidays: UpcomingHolidaySummary[];
}

export interface LeaveBalanceSummary {
    leaveTypeName: string;
    totalLeaves: number;
    usedLeaves: number;
    availableBalance: number;
}

export interface UpcomingHolidaySummary {
    holidayName: string;
    holidayDate: string;
    description: string;
}

export interface LeaveApplyRequest {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveBalance {
    balanceId: number;
    leaveType: {
        leaveTypeId: number;
        leaveTypeName: string;
        defaultDays: number;
        isPaidLeave: boolean;
    };
    year: number;
    totalLeaves: number;
    usedLeaves: number;
    availableBalance: number;
}

export interface EmployeeLeaveApplication {
    leaveId: number;
    leaveType: {
        leaveTypeId: number;
        leaveTypeName: string;
    };
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
    managerComments: string | null;
    appliedDate: string;
    actionDate: string | null;
}

export interface PerformanceReview {
    reviewId: number;
    employee?: any;
    reviewer?: any;
    reviewPeriod: string;
    keyDeliverables: string | null;
    accomplishments: string | null;
    areasOfImprovement: string | null;
    selfAssessmentRating: number | null;
    managerRating: number | null;
    managerFeedback: string | null;
    status: string;
    submittedDate: string | null;
    reviewedDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Goal {
    goalId: number;
    employee?: any;
    title: string;
    description: string | null;
    year: number;
    deadline: string;
    priority: string;
    status: string;
    progress: number;
    managerComments: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PerformanceReviewRequest {
    reviewPeriod: string;
    keyDeliverables?: string;
    accomplishments?: string;
    areasOfImprovement?: string;
    selfAssessmentRating?: number;
}

export interface GoalRequest {
    title: string;
    description?: string;
    deadline: string;
    priority: string;
}

export interface GoalProgressRequest {
    progress: number;
    status?: string;
}

export interface EmployeeDirectoryEntry {
    employeeId: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    departmentName: string | null;
    designationTitle: string | null;
    role: string;
    isActive: boolean;
}

export interface LeaveActionRequest {
    action: string;
    comments?: string;
}

export interface TeamLeaveCalendarEntry {
    employeeCode: string;
    employeeName: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
}

export interface ManagerFeedbackRequest {
    managerRating: number; 
    managerFeedback: string;
}

export interface ManagerGoalCommentRequest {
    managerComments: string;
}

export interface TeamCount {
    total: number;
    active: number;
}

export interface ActivityLog {
    logId: number;
    performedBy: {
        employeeId: number;
        firstName: string;
        lastName: string;
        employeeCode: string;
        email: string;
    } | null;
    action: string;
    entityType: string;
    entityId: number | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    status: string | null;
    createdAt: string;
}

