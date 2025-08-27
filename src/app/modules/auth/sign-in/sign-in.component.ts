import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'app/modules/auth/shared/services/auth.service'; // Correct path to your custom service
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

import { FuseAlertComponent } from '@fuse/components/alert';

export interface Alert {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    position?: 'inline' | 'bottom';
}

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrls: ['./sign-in.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatRadioModule,
        FuseAlertComponent
    ],
})
export class AuthSignInComponent implements OnInit {
    showAlert: boolean = false;
    alert: Alert = { type: 'error', message: '' };
    signInForm: FormGroup;
    registerForm: FormGroup;
    formType: 'login' | 'register' = 'login';
    showPassword = false;
    showTermsModal = false;
    showDataPrivacyModal = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.signInForm = this.fb.group({
            username: ['individual@geminia.com', [Validators.required, Validators.email]],
            password: ['password123', Validators.required],
            agreementAccepted: [false, Validators.requiredTrue] // Added checkbox for sign-in
        });

        this.registerForm = this.fb.group({
            accountType: ['individual', Validators.required],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            kraPin: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{10}$/)]], // Example: 10 alphanumeric characters
            phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?\d{10,14}$/)]], // Example: +1234567890 or 0712345678
            iraNumber: [''],
            pinNumber: [''],
            password: ['', [Validators.required, Validators.minLength(8)]], // Minimum 8 characters
            agreementAccepted: [false, Validators.requiredTrue]
        });

        // --- Conditional Validation Logic ---
        this.registerForm.get('accountType').valueChanges.subscribe(accountType => {
            this.clearIndividualValidators();
            this.clearIntermediaryValidators();

            if (accountType === 'individual') {
                this.setIndividualValidators();
            } else if (accountType === 'intermediary') {
                this.setIntermediaryValidators();
            }

            // Update validity for the whole form
            this.registerForm.updateValueAndValidity();
        });

        // Initially set validators for the default 'individual' type
        this.setIndividualValidators();
    }

    private clearIndividualValidators(): void {
        this.registerForm.get('fullName').clearValidators();
        this.registerForm.get('email').clearValidators();
        this.registerForm.get('kraPin').clearValidators();
        this.registerForm.get('phoneNumber').clearValidators();
        this.registerForm.get('fullName').updateValueAndValidity();
        this.registerForm.get('email').updateValueAndValidity();
        this.registerForm.get('kraPin').updateValueAndValidity();
        this.registerForm.get('phoneNumber').updateValueAndValidity();
    }

    private setIndividualValidators(): void {
        this.registerForm.get('fullName').setValidators(Validators.required);
        this.registerForm.get('email').setValidators([Validators.required, Validators.email]);
        this.registerForm.get('kraPin').setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{10}$/)]);
        this.registerForm.get('phoneNumber').setValidators([Validators.required, Validators.pattern(/^\+?\d{10,14}$/)]);
        this.registerForm.get('fullName').updateValueAndValidity();
        this.registerForm.get('email').updateValueAndValidity();
        this.registerForm.get('kraPin').updateValueAndValidity();
        this.registerForm.get('phoneNumber').updateValueAndValidity();
    }

    private clearIntermediaryValidators(): void {
        this.registerForm.get('iraNumber').clearValidators();
        this.registerForm.get('pinNumber').clearValidators();
        this.registerForm.get('iraNumber').updateValueAndValidity();
        this.registerForm.get('pinNumber').updateValueAndValidity();
    }

    private setIntermediaryValidators(): void {
        this.registerForm.get('iraNumber').setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,15}$/)]); // Example: 5-15 alphanumeric
        this.registerForm.get('pinNumber').setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{10}$/)]); // Example: 10 alphanumeric
        this.registerForm.get('iraNumber').updateValueAndValidity();
        this.registerForm.get('pinNumber').updateValueAndValidity();
    }

    signIn(): void {
        if (this.signInForm.invalid) {
            this.alert = { type: 'error', message: 'Please enter a valid email and password and accept the terms.', position: 'bottom' };
            this.showAlert = true;
            return;
        }

        this.signInForm.disable();
        this.showAlert = false;

        const { username, password } = this.signInForm.value;

        setTimeout(() => {
            const success = this.authService.login(username, password);

            if (success) {
                this.router.navigate(['/sign-up/dashboard']);
            } else {
                this.alert = { type: 'error', message: 'Wrong email or password. Please try again.', position: 'bottom' };
                this.showAlert = true;
                this.signInForm.enable();
            }
        }, 1000);
    }

    register(): void {
        if (this.registerForm.invalid) {
            // Mark all fields as touched to display validation messages
            this.markAllAsTouched(this.registerForm);
            this.alert = { type: 'error', message: 'Please correct the highlighted errors.', position: 'bottom' };
            this.showAlert = true;
            return;
        }
        this.registerForm.disable();
        console.log('Registering user...', this.registerForm.value);

        setTimeout(() => {
            this.alert = { type: 'success', message: 'Registration successful! Please sign in.', position: 'bottom' };
            this.showAlert = true;
            this.formType = 'login';
            this.registerForm.enable();
            setTimeout(() => this.showAlert = false, 5000);
        }, 1500);
    }

    // Helper to mark all controls in a form group as touched
    private markAllAsTouched(formGroup: FormGroup): void {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if ((control as FormGroup).controls) {
                this.markAllAsTouched(control as FormGroup);
            }
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}