import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LeaveService } from './leave.service';
import { environment } from '../../environments/environment';

describe('LeaveService', () => {
  let service: LeaveService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LeaveService]
    });

    service = TestBed.inject(LeaveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should apply for leave', () => {
    const leaveRequest = {
      leaveTypeId: 1,
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      reason: 'Vacation'
    };
    const mockResponse = {
      success: true,
      data: {
        leaveApplicationId: 1
      }
    };

    service.applyForLeave(leaveRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/employee/leaves/apply`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get leave applications', () => {
    const mockResponse = {
      success: true,
      data: {
        content: [],
        totalElements: 0
      }
    };

    service.getLeaveApplications({ page: 0, size: 10 }).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(req => req.url.includes('/employee/leaves'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should cancel leave', () => {
    const mockResponse = {
      success: true,
      message: 'Leave cancelled successfully'
    };

    service.cancelLeave(1).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/employee/leaves/1/cancel`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockResponse);
  });
});

