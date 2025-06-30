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
  selector: 'app-auth-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth-sign-up.component.html',
  styleUrl: './auth-sign-up.component.scss',
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
export class UserRegistrationComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _cd = inject(ChangeDetectorRef);

  signUpForm!: FormGroup;
  showPassword: boolean = false;
  showAlert: boolean = false;
  selectedAccountType: string = '';
  alert: { type: 'success' | 'error'; message: string } = {
    type: 'error',
    message: '',
  };

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  private initializeForm(): void {
    this.signUpForm = this._formBuilder.group({
      accountType: ['', Validators.required],
      // Individual/Corporate fields
      name: [''],
      email: [''],
      kraPin: [''],
      phoneNumber: [''],
      // Intermediary fields
      iraNumber: [''],
      pinNumber: [''],
      // Common field
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  private setupFormSubscriptions(): void {
    this.signUpForm.get('accountType')?.valueChanges.subscribe((value) => {
      this.selectedAccountType = value;
      this.updateFormValidators(value);
      this._cd.markForCheck();
    });
  }

  private updateFormValidators(accountType: string): void {
    // Clear all validators first
    this.signUpForm.get('name')?.clearValidators();
    this.signUpForm.get('email')?.clearValidators();
    this.signUpForm.get('kraPin')?.clearValidators();
    this.signUpForm.get('phoneNumber')?.clearValidators();
    this.signUpForm.get('iraNumber')?.clearValidators();
    this.signUpForm.get('pinNumber')?.clearValidators();

    // Reset form control values for fields not used by current account type
    if (accountType === 'individual' || accountType === 'corporate') {
      // Clear intermediary fields
      this.signUpForm.get('iraNumber')?.setValue('');
      this.signUpForm.get('pinNumber')?.setValue('');
      
      // Set validators for individual/corporate fields
      this.signUpForm.get('name')?.setValidators([Validators.required]);
      this.signUpForm
        .get('email')
        ?.setValidators([Validators.required, Validators.email]);
      this.signUpForm.get('kraPin')?.setValidators([Validators.required]);
      this.signUpForm.get('phoneNumber')?.setValidators([Validators.required]);
    } else if (accountType === 'intermediary') {
      // Clear individual/corporate fields
      this.signUpForm.get('name')?.setValue('');
      this.signUpForm.get('email')?.setValue('');
      this.signUpForm.get('kraPin')?.setValue('');
      this.signUpForm.get('phoneNumber')?.setValue('');
      
      // Set validators for intermediary fields
      this.signUpForm.get('iraNumber')?.setValidators([Validators.required]);
      this.signUpForm.get('pinNumber')?.setValidators([Validators.required]);
    }

    // Update form control validity
    Object.keys(this.signUpForm.controls).forEach((key) => {
      this.signUpForm.get(key)?.updateValueAndValidity();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signUp(): void {
    if (this.signUpForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.signUpForm.markAllAsTouched();
      this.showAlert = true;
      this.alert = {
        type: 'error',
        message: 'Please fill in all required fields correctly.',
      };
      this._cd.markForCheck();
      return;
    }

    // Disable form and hide any existing alerts
    this.signUpForm.disable();
    this.showAlert = false;
    this._cd.markForCheck();

    const formData = this.getFormData();
    console.log('Registration Data:', formData); // For debugging

    // Simulate API call with immediate success for demo
    setTimeout(() => {
      // Show success message briefly
      this.alert = {
        type: 'success',
        message: `Welcome! Your ${this.getAccountTypeDisplayName()} account has been created successfully.`,
      };
      this.showAlert = true;
      this._cd.markForCheck();

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        this._router.navigate(['/dashboard']);
      }, 1500);
    }, 1000);
  }

  private getFormData(): any {
    const formValue = this.signUpForm.value;
    const accountType = formValue.accountType;

    if (accountType === 'individual' || accountType === 'corporate') {
      return {
        accountType,
        name: formValue.name,
        email: formValue.email,
        kraPin: formValue.kraPin,
        phoneNumber: formValue.phoneNumber,
        password: formValue.password,
        timestamp: new Date().toISOString(),
      };
    } else if (accountType === 'intermediary') {
      return {
        accountType,
        iraNumber: formValue.iraNumber,
        pinNumber: formValue.pinNumber,
        password: formValue.password,
        timestamp: new Date().toISOString(),
      };
    }

    return formValue;
  }

  private getAccountTypeDisplayName(): string {
    switch (this.selectedAccountType) {
      case 'individual':
        return 'Individual';
      case 'corporate':
        return 'Corporate';
      case 'intermediary':
        return 'Intermediary';
      default:
        return 'Account';
    }
  }
}