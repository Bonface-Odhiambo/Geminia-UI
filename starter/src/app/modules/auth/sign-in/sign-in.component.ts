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
      transition('void => *', []), // Prevent animation on initial load
      transition('* => *', [
        style({ transform: 'translateX(0)' }),
        animate('100ms ease-out', style({ transform: 'translateX(-10px)' })),
        animate('100ms ease-in', style({ transform: 'translateX(10px)' })),
        animate('100ms ease-out', style({ transform: 'translateX(-5px)' })),
        animate('100ms ease-in', style({ transform: 'translateX(5px)' })),
        animate('100ms ease-out', style({ transform: 'translateX(0)' })),
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
    });
  }

  /**
   * Check if the form is valid
   */
  isFormValid(): boolean {
    const usernameControl = this.signInForm.get('username');
    const passwordControl = this.signInForm.get('password');
    return (
      (usernameControl?.valid && passwordControl?.valid) ?? false
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {
    // If the form is invalid, trigger the alert and do nothing else
    if (this.signInForm.invalid) {
      this.alert = {
        type: 'error',
        message: 'Please fill in both email and password.',
      };
      this.showAlert = true;
      // Trigger shake animation
      this._cd.markForCheck();
      return;
    }

    this.signInForm.disable();
    this.showAlert = false;

    // Simulate authentication delay
    setTimeout(() => {
      this.handleCredentialAuthentication();
    }, 1500);
  }

  private handleCredentialAuthentication(): void {
    const formValue = this.signInForm.getRawValue(); // Use getRawValue to get values from disabled form
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
        message: 'Sign in successful! Redirecting...',
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
      this._cd.markForCheck();
    }
  }

  getMarineQuote(): void {
    console.log('Navigating to marine quick quote page...');
    // this._router.navigate(['/sign-up/marine-quote']);
  }

  getTravelQuote(): void {
    console.log('Navigating to travel quick quote page...');
    // this._router.navigate(['/sign-up/travel-quote']);
  }
}