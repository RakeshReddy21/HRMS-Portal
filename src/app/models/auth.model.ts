export interface LoginRequest{
    email: string;
    password: string;
}
export interface RefreshTokenRequest{
    refreshToken: string;
}
export interface ApiResponse<T = any>{
    success : boolean;
    message : string;
    data: T;
}
export interface LoginResponseData{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    employeeId: number;
    employeeCode: string;
    name: string;
    email: string;
    role: string;
}
export interface TwoFactorResponseData{
    twoFactorRequired: boolean;
    preAuthToken: string;
    maskedEmail: string;
}
export interface VerifyOtpRequest{
    preAuthToken: string;
    otp: string;
}
export interface ResendOtpRequest{
    preAuthToken: string;
}
export interface RefreshTokenResponseData{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
}
export enum Role{
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE',
    MANAGER = 'MANAGER'
}
export interface StoredUser{
    employeeId: number;
    employeeCode: string;
    name: string;
    email: string;
    role: Role;
}
