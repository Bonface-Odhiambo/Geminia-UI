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

// NOTE: The original template uses a custom <fuse-alert> component.
// This implementation will use a standard <div> for the alert message.
// You would replace the <div> with your custom component.

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
        animate(
          '300ms ease-in-out',
          style({ transform: 'translateX(-10px)' }),
        ),
        animate(
          '300ms ease-in-out',
          style({ transform: 'translateX(10px)' }),
        ),
        animate(
          '300ms ease-in-out',
          style({ transform: 'translateX(0)' }),
        ),
      ]),
    ]),
  ],
})
export class AuthSignInComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _cd = inject(ChangeDetectorRef);

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
      username: [
        'intermediary@company.com',
        [Validators.required, Validators.email],
      ],
      password: ['password', [Validators.required]],
      otpCode: [
        '',
        [Validators.required, Validators.pattern(/^\d{6}$/)],
      ],
    });

    // Initially, disable the OTP field
    this.signInForm.get('otpCode')?.disable();
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
      return;
    }

    this.signInForm.disable();
    this.showAlert = false;

    // Simulate an API call
    setTimeout(() => {
      // Example error case
      this.alert = {
        type: 'error',
        message: 'Invalid credentials. Please try again.',
      };
      this.showAlert = true;
      this.signInForm.enable(); // Re-enable form on error
      this.toggleOTP(this.useOTP); // Re-apply correct disabled state
      this._cd.markForCheck(); // Manually trigger change detection
    }, 2000);

    // On a successful sign-in, you would navigate the use
    window.location.href="/sign-up/dashboard"
    // e.g., this._router.navigate(['/dashboard']);
  }

  resendOTP(): void {
    console.log('Resending OTP...');
    // Add logic to resend OTP and show a confirmation message
  }

  getQuickQuote(): void {
    console.log('Navigating to quick quote page...');
    // Example navigation
    // this._router.navigate(['/quick-quote']);
  }
}