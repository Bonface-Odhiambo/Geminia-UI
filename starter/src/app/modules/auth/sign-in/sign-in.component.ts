import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';

// Angular Material Modules
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('shake', [
      transition('* => *', [
        style({ transform: 'translateX(0)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(-10px)' })),
        animate('300ms ease-in-out', style({ transform: 'translateX(10px)' })),
        animate('300ms ease-in-out', style({ transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class AuthSignInComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _cd = inject(ChangeDetectorRef);

  // Hardcoded credentials
  private readonly VALID_CREDENTIALS = {
    username: 'principalresearcher138@gmail.com',
    password: '1234567',
  };

  signInForm!: FormGroup;
  useOTP: boolean = false;
  showPassword: boolean = false;
  showAlert: boolean = false;
  alert: { type: 'success' | 'error'; message: string } = {
    type: 'error',
    message: '',
  };

  ngOnInit(): void {
    this.signInForm = this._formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.toggleOTP(false);
  }

  toggleOTP(state: boolean): void {
    this.useOTP = state;
    if (this.useOTP) {
      this.signInForm.get('username')?.disable();
      this.signInForm.get('password')?.disable();
      this.signInForm.get('otpCode')?.enable();
    } else {
      this.signInForm.get('username')?.enable();
      this.signInForm.get('password')?.enable();
      this.signInForm.get('otpCode')?.disable();
    }
    this.showAlert = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.signInForm.disable();
    this.showAlert = false;

    // Simulate authentication delay
    setTimeout(() => {
      if (this.useOTP) {
        // Handle OTP authentication (you can add OTP logic here if needed)
        this.handleOTPAuthentication();
      } else {
        // Handle email/password authentication
        this.handleCredentialAuthentication();
      }
    }, 2000);
  }

  private handleCredentialAuthentication(): void {
    const formValue = this.signInForm.value;
    const enteredUsername = formValue.username?.toLowerCase().trim();
    const enteredPassword = formValue.password;

    // Check against hardcoded credentials
    if (
      enteredUsername === this.VALID_CREDENTIALS.username.toLowerCase() &&
      enteredPassword === this.VALID_CREDENTIALS.password
    ) {
      // Successful authentication
      this.alert = {
        type: 'success',
        message: 'Sign in successful! Redirecting to dashboard...',
      };
      this.showAlert = true;
      this._cd.markForCheck();

      // Redirect to dashboard after showing success message
      setTimeout(() => {
        this._router.navigate(['/sign-up/dashboard']);
      }, 1500);
    } else {
      // Failed authentication
      this.alert = {
        type: 'error',
        message: 'Invalid credentials. Please try again.',
      };
      this.showAlert = true;
      this.signInForm.enable();
      this.toggleOTP(this.useOTP);
      this._cd.markForCheck();
    }
  }

  private handleOTPAuthentication(): void {
    const otpCode = this.signInForm.value.otpCode;
    
    // For demo purposes, accept '123456' as valid OTP
    if (otpCode === '123456') {
      this.alert = {
        type: 'success',
        message: 'OTP verified! Redirecting to dashboard...',
      };
      this.showAlert = true;
      this._cd.markForCheck();

      setTimeout(() => {
        this._router.navigate(['/sign-up/dashboard']);
      }, 1500);
    } else {
      this.alert = {
        type: 'error',
        message: 'Invalid OTP code. Please try again.',
      };
      this.showAlert = true;
      this.signInForm.enable();
      this.toggleOTP(this.useOTP);
      this._cd.markForCheck();
    }
  }

  resendOTP(): void {
    console.log('Resending OTP...');
    // Add OTP resend logic here if needed
  }

  getMarineQuote(): void {
    console.log('Navigating to marine quick quote page...');
    // Example navigation: this._router.navigate(['/sign-up/marine-quote']);
  }

  getTravelQuote(): void {
    console.log('Navigating to travel quick quote page...');
    // Example navigation: this._router.navigate(['/sign-up/travel-quote']);
  }
}