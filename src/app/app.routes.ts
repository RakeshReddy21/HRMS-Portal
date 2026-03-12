import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { Role } from './models/auth.model';
import { Layout } from './layout/layout';

export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login)},
    {
        path: '',
        component: Layout,
        canActivate: [authGuard],
        children: [
            {
                path: 'admin/dashboard', 
                loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.Dashboard),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/employees/register',
                loadComponent: () => import('./pages/admin/employees/employee-register/employee-register').then(m => m.EmployeeRegister),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/employees',
                loadComponent: () => import('./pages/admin/employees/employee-list/employee-list').then(m => m.EmployeeList),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/employees/:code',
                loadComponent: () => import('./pages/admin/employees/employee-detail/employee-detail').then(m => m.EmployeeDetail),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/departments',
                loadComponent: () => import('./pages/admin/departments/department-list').then(m => m.DepartmentList),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/designations',
                loadComponent: () => import('./pages/admin/designations/designation-list').then(m => m.DesignationList),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/leaves',
                loadComponent: () => import('./pages/admin/leaves/leave-management').then(m => m.LeaveManagement),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/announcements',
                loadComponent: () => import('./pages/admin/announcements/announcement-list').then(m => m.AnnouncementList),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/attendance',
                loadComponent: () => import('./pages/admin/attendance/attendance-management').then(m => m.AttendanceManagement),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/performance-reviews',
                loadComponent: () => import('./pages/admin/performance-reviews/performance-reviews').then(m => m.PerformanceReviews),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/activity-logs',
                loadComponent: () => import('./pages/admin/activity-logs/activity-logs').then(m => m.ActivityLogs),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/ip-access',
                loadComponent: () => import('./pages/admin/ip-access/ip-access').then(m => m.IpAccess),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'manager/dashboard',
                loadComponent: () => import('./pages/manager/dashboard/dashboard').then(m => m.Dashboard),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'manager/my-attendance',
                loadComponent: () => import('./pages/employee/attendance/my-attendance').then(m => m.MyAttendance),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'manager/my-leaves',
                loadComponent: () => import('./pages/employee/leaves/my-leaves').then(m => m.MyLeaves),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'manager/team',
                loadComponent: () => import('./pages/manager/team/team').then(m => m.Team),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'manager/team-leaves',
                loadComponent: () => import('./pages/manager/team-leaves/team-leaves').then(m => m.TeamLeaves),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'manager/team-attendance',
                loadComponent: () => import('./pages/manager/team-attendance/team-attendance').then(m => m.TeamAttendance),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'manager/team-performance',
                loadComponent: () => import('./pages/manager/team-performance/team-performance').then(m => m.TeamPerformance),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'chat',
                loadComponent: () => import('./pages/chat/chat').then(m => m.Chat),
                canActivate: [authGuard]
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings').then(m => m.Settings),
                canActivate: [authGuard]
            },
            {
                path: 'employee/dashboard',
                loadComponent: () => import('./pages/employee/dashboard/dashboard').then(m => m.Dashboard),
                canActivate: [authGuard, roleGuard(Role.EMPLOYEE)]
            },
            {
                path: 'employee/my-attendance',
                loadComponent: () => import('./pages/employee/attendance/my-attendance').then(m => m.MyAttendance),
                canActivate: [authGuard, roleGuard(Role.EMPLOYEE)]
            },
            {
                path: 'employee/my-leaves',
                loadComponent: () => import('./pages/employee/leaves/my-leaves').then(m => m.MyLeaves),
                canActivate: [authGuard, roleGuard(Role.EMPLOYEE)]
            },
            {
                path: 'employee/my-performance',
                loadComponent: () => import('./pages/employee/performance/my-performance').then(m => m.MyPerformance),
                canActivate: [authGuard, roleGuard(Role.EMPLOYEE)]
            },
            {
                path: 'employee/directory',
                loadComponent: () => import('./pages/employee/directory/employee-directory').then(m => m.EmployeeDirectory),
                canActivate: [authGuard, roleGuard(Role.EMPLOYEE)]
            },
            {
                path: 'employee/announcements',
                loadComponent: () => import('./pages/employee/announcements/employee-announcements').then(m => m.EmployeeAnnouncements),
                canActivate: [authGuard, roleGuard(Role.EMPLOYEE)]
            },
            {
                path: 'employee/my-expenses',
                loadComponent: () => import('./pages/employee/expenses/my-expenses').then(m => m.MyExpenses),
                canActivate: [authGuard, roleGuard(Role.EMPLOYEE)]
            },
            {
                path: 'manager/team-expenses',
                loadComponent: () => import('./pages/employee/expenses/my-expenses').then(m => m.MyExpenses),
                canActivate: [authGuard, roleGuard(Role.MANAGER)]
            },
            {
                path: 'admin/expenses',
                loadComponent: () => import('./pages/employee/expenses/my-expenses').then(m => m.MyExpenses),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
            {
                path: 'admin/ai-reports',
                loadComponent: () => import('./pages/employee/expenses/my-expenses').then(m => m.MyExpenses),
                canActivate: [authGuard, roleGuard(Role.ADMIN)]
            },
        ]
    },
    {path: '**', redirectTo: 'login'}
];