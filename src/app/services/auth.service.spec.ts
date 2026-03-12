import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { LoginRequest, VerifyOtpRequest, ResendOtpRequest } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const loginRequest: LoginRequest = { email: 'test@example.com', password: 'password123' };
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        employeeCode: 'EMP001'
      }
    };

    service.login(loginRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(localStorage.getItem('accessToken')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
  });

  it('should verify OTP successfully', () => {
    const verifyRequest: VerifyOtpRequest = { email: 'test@example.com', otp: '123456', preAuthToken: 'pre-auth-token' };
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        employeeCode: 'EMP001'
      }
    };

    service.verifyOtp(verifyRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify-otp`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should resend OTP', () => {
    const resendRequest: ResendOtpRequest = { email: 'test@example.com', preAuthToken: 'pre-auth-token' };
    const mockResponse = {
      success: true,
      data: { preAuthToken: 'new-pre-auth-token' }
    };

    service.resendOtp(resendRequest).subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/resend-otp`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should refresh token', () => {
    localStorage.setItem('refreshToken', 'refresh-token');
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    };

    service.refreshToken().subscribe(response => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('accessToken', 'token');
    localStorage.setItem('refreshToken', 'refresh');
    localStorage.setItem('user', '{}');

    service.logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should check if user is authenticated', () => {
    localStorage.setItem('accessToken', 'token');
    expect(service.isAuthenticated()).toBe(true);

    localStorage.removeItem('accessToken');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should get stored user', () => {
    const user = { email: 'test@example.com', role: 'EMPLOYEE', employeeCode: 'EMP001' };
    localStorage.setItem('user', JSON.stringify(user));
    expect(service.getStoredUser()).toEqual(user);
  });
});

