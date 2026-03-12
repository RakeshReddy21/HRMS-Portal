import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get admin dashboard', () => {
    const mockResponse = {
      success: true,
      data: {
        totalEmployees: 100,
        activeEmployees: 95,
        inactiveEmployees: 5
      }
    };

    service.getAdminDashboard().subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get employee dashboard', () => {
    const mockResponse = {
      success: true,
      data: {
        leaveBalance: [],
        upcomingHolidays: []
      }
    };

    service.getEmployeeDashboard().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/employee/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get manager dashboard', () => {
    const mockResponse = {
      success: true,
      data: {
        teamSize: 10,
        pendingLeaves: 5
      }
    };

    service.getManagerDashboard().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/manager/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});

