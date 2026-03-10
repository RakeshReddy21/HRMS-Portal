import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AttendanceService } from './attendance.service';
import { environment } from '../../environments/environment';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AttendanceService]
    });

    service = TestBed.inject(AttendanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check in', () => {
    const checkInRequest = {
      latitude: 40.7128,
      longitude: -74.0060
    };
    const mockResponse = {
      success: true,
      data: {
        attendanceId: 1,
        checkInTime: '2024-01-01T09:00:00'
      }
    };

    service.checkIn(checkInRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/employee/attendance/check-in`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should check out', () => {
    const mockResponse = {
      success: true,
      data: {
        attendanceId: 1,
        checkOutTime: '2024-01-01T18:00:00'
      }
    };

    service.checkOut().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/employee/attendance/check-out`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should get attendance history', () => {
    const mockResponse = {
      success: true,
      data: {
        content: [],
        totalElements: 0
      }
    };

    service.getAttendanceHistory({ page: 0, size: 10 }).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(req => req.url.includes('/employee/attendance'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});

