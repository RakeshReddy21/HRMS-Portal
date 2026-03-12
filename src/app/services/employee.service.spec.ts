import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from './employee.service';
import { environment } from '../../environments/environment';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmployeeService]
    });

    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all employees', () => {
    const mockResponse = {
      success: true,
      data: {
        content: [],
        totalElements: 0
      }
    };

    service.getEmployees({ page: 0, size: 10 }).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(req => req.url.includes('/admin/employees'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get employee by code', () => {
    const mockResponse = {
      success: true,
      data: {
        employeeCode: 'EMP001',
        firstName: 'John',
        lastName: 'Doe'
      }
    };

    service.getEmployeeByCode('EMP001').subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/employees/EMP001`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should register employee', () => {
    const registerRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123'
    };
    const mockResponse = {
      success: true,
      data: {
        employeeCode: 'EMP001'
      }
    };

    service.registerEmployee(registerRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/employees/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});

