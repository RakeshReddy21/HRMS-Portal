import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DepartmentService } from './department.service';
import { environment } from '../../environments/environment';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DepartmentService]
    });

    service = TestBed.inject(DepartmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all departments', () => {
    const mockResponse = {
      success: true,
      data: []
    };

    service.getDepartments().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/departments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create department', () => {
    const departmentRequest = {
      departmentName: 'IT',
      description: 'Information Technology'
    };
    const mockResponse = {
      success: true,
      data: {
        departmentId: 1,
        departmentName: 'IT'
      }
    };

    service.createDepartment(departmentRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/departments`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update department', () => {
    const departmentRequest = {
      departmentName: 'IT Updated'
    };
    const mockResponse = {
      success: true,
      data: {
        departmentId: 1,
        departmentName: 'IT Updated'
      }
    };

    service.updateDepartment(1, departmentRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/departments/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });
});

