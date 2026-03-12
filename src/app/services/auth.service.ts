import {HttpClient} from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {ApiResponse, LoginRequest, LoginResponseData, RefreshTokenRequest, RefreshTokenResponseData, ResendOtpRequest, Role, StoredUser, TwoFactorResponseData, VerifyOtpRequest} from '../models/auth.model';

@Injectable({providedIn: 'root'})
export class AuthService{
    private readonly apiUrl = `${environment.apiUrl}/auth`;
    private readonly TOKEN_KEY = 'accessToken';
    private readonly REFRESH_TOKEN_KEY = 'refreshToken';
    private readonly USER_KEY = 'user';

    currentUser = signal<StoredUser | null>(this.getStoredUser());
    constructor(private http: HttpClient, private router: Router) {}

    login(request: LoginRequest): Observable<ApiResponse<LoginResponseData | TwoFactorResponseData>> {
        return this.http.post<ApiResponse<LoginResponseData | TwoFactorResponseData>>(`${this.apiUrl}/login`, request)
        .pipe(tap((response) => {
                if(response.success && response.data && !this.isTwoFactorResponse(response.data)){
                    const data = response.data as LoginResponseData;
                    this.storeToken(data.accessToken, data.refreshToken);
                    this.storeUser(data);
                }
            })
        );
    }
    verifyOtp(request: VerifyOtpRequest): Observable<ApiResponse<LoginResponseData>> {
        return this.http.post<ApiResponse<LoginResponseData>>(`${this.apiUrl}/verify-otp`, request)
        .pipe(tap((response) => {
                if(response.success && response.data){
                    this.storeToken(response.data.accessToken, response.data.refreshToken);
                    this.storeUser(response.data);
                }
            })
        );
    }
    resendOtp(request: ResendOtpRequest): Observable<ApiResponse<{preAuthToken: string}>> {
        return this.http.post<ApiResponse<{preAuthToken: string}>>(`${this.apiUrl}/resend-otp`, request);
    }
    isTwoFactorResponse(data: any): data is TwoFactorResponseData {
        return data && data.twoFactorRequired === true;
    }
    refreshToken(): Observable<ApiResponse<RefreshTokenRequest>>{
        const request: RefreshTokenRequest = {refreshToken: this.getRefreshToken() || ''};
        return this.http.post<ApiResponse<RefreshTokenResponseData>>(`${this.apiUrl}/refresh`, request)
            .pipe(tap((response) => {
                if(response.success && response.data){
                    this.storeToken(response.data.accessToken, response.data.refreshToken);
                }
            })
        );
    }
    logout() : void{
        this.http.post<ApiResponse>(`${this.apiUrl}/logout`, {}).subscribe({
            complete: () => this.clearSession(),
            error: () => this.clearSession()
        });
    }
    getAccessToken(): string | null {return localStorage.getItem(this.TOKEN_KEY);}
    getRefreshToken(): string | null {return localStorage.getItem(this.REFRESH_TOKEN_KEY);}
    isLoggedIn(): boolean {return !!this.getAccessToken();}
    getRole() : Role | null {
        const user = this.getStoredUser();
        return user ? user.role : null;
    }
    hasAnyRole(...roles: Role[]) : boolean {
        const currentRole = this.getRole();
        return currentRole ? roles.includes(currentRole) : false;
    }
    redirectByRole(): void{
        switch(this.getRole()){
            case Role.ADMIN: this.router.navigate(['/admin/dashboard']); break;
            case Role.MANAGER: this.router.navigate(['/manager/dashboard']); break;
            case Role.EMPLOYEE: this.router.navigate(['/employee/dashboard']); break;
            default: this.router.navigate(['/login']); break;
        }
    }
    private storeToken(accessToken: string, refreshToken: string): void{
        localStorage.setItem(this.TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    private storeUser(data: LoginResponseData): void{
        const user : StoredUser = {
            employeeId : data.employeeId, employeeCode : data.employeeCode, name : data.name, email : data.email, role : data.role as Role
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
    }
    private getStoredUser(): StoredUser | null {
        const json = localStorage.getItem(this.USER_KEY);
        if(!json) return null;
        try{return JSON.parse(json) as StoredUser;} catch {return null;}
    }
    private clearSession(): void{
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }
}
