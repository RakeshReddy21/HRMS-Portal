import { Component, signal, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {LoginRequest, TwoFactorResponseData, VerifyOtpRequest} from '../../models/auth.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  step = signal<'credentials' | 'otp'>('credentials');
  preAuthToken = signal('');
  maskedEmail = signal('');
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  resendCooldown = signal(0);
  private resendTimer: any = null;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ){
    if(this.authService.isLoggedIn()){
      this.authService.redirectByRole();
    }
    this.loginForm = this.fb.group({
      email : ['',[Validators.required, Validators.email]],
      password : ['',[Validators.required, Validators.minLength(6)]]
    });
  }

  togglePassword(): void{
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void{
    if(this.loginForm.invalid){
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    const request: LoginRequest = this.loginForm.value;
    this.authService.login(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if(response.success){
          if(this.authService.isTwoFactorResponse(response.data)){
            const twoFactorData = response.data as TwoFactorResponseData;
            this.preAuthToken.set(twoFactorData.preAuthToken);
            this.maskedEmail.set(twoFactorData.maskedEmail);
            this.step.set('otp');
            this.successMessage.set(response.message);
            this.startResendCooldown();
            setTimeout(() => this.focusOtpInput(0), 100);
          } else {
            this.authService.redirectByRole();
          }
        } else {
          this.errorMessage.set(response.message || 'Login Failed, Please try again.');
        }
      },
      error:(err) => {
        this.isLoading.set(false);
        if(err.status === 401){
          this.errorMessage.set('Invalid email or password');
        } else if(err.status === 403){
          this.errorMessage.set(err.error?.message || 'Access denied. Please contact your administrator.');
        } else if(err.status === 0){
          this.errorMessage.set('Unable to connect to the server');
        } else {
          this.errorMessage.set(err.error?.message || 'An unexpected error occurred');
        }
      }
    })
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 1) {
      const digits = value.split('');
      const current = [...this.otpDigits()];
      for (let i = 0; i < 6; i++) {
        current[i] = digits[i] || '';
      }
      this.otpDigits.set(current);
      setTimeout(() => {
        const inputs = this.otpInputs?.toArray();
        if (inputs) {
          current.forEach((d, idx) => {
            if (inputs[idx]) inputs[idx].nativeElement.value = d;
          });
          let lastFilled = -1;
          for (let i = current.length - 1; i >= 0; i--) {
            if (current[i] !== '') { lastFilled = i; break; }
          }
          if (lastFilled === 5) {
            this.autoSubmitOtp();
          } else {
            this.focusOtpInput(Math.min(lastFilled + 1, 5));
          }
        }
      });
      return;
    }

    const current = [...this.otpDigits()];
    current[index] = value.charAt(0) || '';
    this.otpDigits.set(current);
    input.value = current[index];

    if (current[index] && index < 5) {
      this.focusOtpInput(index + 1);
    }
    if (current.every(d => d !== '')) {
      this.autoSubmitOtp();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const current = [...this.otpDigits()];
      if (!current[index] && index > 0) {
        current[index - 1] = '';
        this.otpDigits.set(current);
        const inputs = this.otpInputs?.toArray();
        if (inputs && inputs[index - 1]) {
          inputs[index - 1].nativeElement.value = '';
        }
        this.focusOtpInput(index - 1);
        event.preventDefault();
      } else {
        current[index] = '';
        this.otpDigits.set(current);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusOtpInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.focusOtpInput(index + 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '') || '';
    if (pasted.length === 0) return;
    const digits = pasted.substring(0, 6).split('');
    const current = [...this.otpDigits()];
    for (let i = 0; i < 6; i++) {
      current[i] = digits[i] || '';
    }
    this.otpDigits.set(current);
    setTimeout(() => {
      const inputs = this.otpInputs?.toArray();
      if (inputs) {
        current.forEach((d, idx) => {
          if (inputs[idx]) inputs[idx].nativeElement.value = d;
        });
        if (current.every(d => d !== '')) {
          this.autoSubmitOtp();
        }
      }
    });
  }

  private focusOtpInput(index: number): void {
    const inputs = this.otpInputs?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
      inputs[index].nativeElement.select();
    }
  }

  private autoSubmitOtp(): void {
    const otp = this.otpDigits().join('');
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      this.submitOtp();
    }
  }

  submitOtp(): void {
    const otp = this.otpDigits().join('');
    if (otp.length !== 6) {
      this.errorMessage.set('Please enter the complete 6-digit code');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    const request: VerifyOtpRequest = {
      preAuthToken: this.preAuthToken(),
      otp: otp
    };
    this.authService.verifyOtp(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.authService.redirectByRole();
        } else {
          this.errorMessage.set(response.message || 'Verification failed');
          this.clearOtpInputs();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Verification failed. Please try again.');
        this.clearOtpInputs();
      }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown() > 0) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.authService.resendOtp({ preAuthToken: this.preAuthToken() }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success && response.data) {
          this.preAuthToken.set(response.data.preAuthToken);
          this.successMessage.set('A new verification code has been sent to your email');
          this.clearOtpInputs();
          this.startResendCooldown();
          setTimeout(() => this.focusOtpInput(0), 100);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to resend code. Please login again.');
        if (err.status === 400) {
          setTimeout(() => this.backToLogin(), 2000);
        }
      }
    });
  }

  backToLogin(): void {
    this.step.set('credentials');
    this.preAuthToken.set('');
    this.maskedEmail.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.clearOtpInputs();
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  private clearOtpInputs(): void {
    this.otpDigits.set(['', '', '', '', '', '']);
    setTimeout(() => {
      const inputs = this.otpInputs?.toArray();
      if (inputs) {
        inputs.forEach(i => i.nativeElement.value = '');
      }
      this.focusOtpInput(0);
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }
}
