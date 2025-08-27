import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { Router, RouterModule } from '@angular/router';
import { FuseAlertComponent } from '@fuse/components/alert';
import { AuthService } from 'app/modules/auth/shared/services/auth.service';

export interface Alert {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    position?: 'inline' | 'bottom';
}

export interface PasswordStrength {
    level: number;
    text: string;
    color: string;
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
        FuseAlertComponent,
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
            username: [
                'individual@geminia.com',
                [Validators.required, Validators.email],
            ],
            password: ['password123', Validators.required],
            agreementAccepted: [false, Validators.requiredTrue],
        });

        this.registerForm = this.fb.group({
            accountType: ['individual', Validators.required],
            fullName: ['', [Validators.required, this.fullNameValidator]],
            email: ['', [Validators.required, Validators.email]],
            kraPin: ['', [Validators.required, this.kraPinValidator]],
            phoneNumber: ['', [Validators.required, this.phoneNumberValidator]],
            iraNumber: [''],
            pinNumber: [''],
            password: ['', [Validators.required, this.strongPasswordValidator]],
            agreementAccepted: [false, Validators.requiredTrue],
        });

        // Conditional Validation Logic
        this.registerForm
            .get('accountType')
            ?.valueChanges.subscribe((accountType) => {
                this.clearIndividualValidators();
                this.clearIntermediaryValidators();

                if (accountType === 'individual') {
                    this.setIndividualValidators();
                } else if (accountType === 'intermediary') {
                    this.setIntermediaryValidators();
                }

                this.registerForm.updateValueAndValidity();
            });

        // Initially set validators for the default 'individual' type
        this.setIndividualValidators();
    }

    // Custom validators
    fullNameValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const names = control.value
            .trim()
            .split(' ')
            .filter((name: string) => name.length > 0);
        return names.length >= 2 ? null : { fullNameInvalid: true };
    }

    kraPinValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const kraPattern = /^[A-Za-z]\d{9}[A-Za-z]$/;
        return kraPattern.test(control.value) ? null : { kraPinInvalid: true };
    }

    phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const phonePattern = /^\+254\d{9,12}$/;
        return phonePattern.test(control.value)
            ? null
            : { phoneNumberInvalid: true };
    }

    strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;

        const value = control.value;
        const hasMinLength = value.length >= 8;
        const hasLowerCase = /(?=.*[a-z])/.test(value);
        const hasUpperCase = /(?=.*[A-Z])/.test(value);
        const hasNumber = /(?=.*\d)/.test(value);
        const hasSpecialChar = /(?=.*[@$!%*?&])/.test(value);

        const valid =
            hasMinLength &&
            hasLowerCase &&
            hasUpperCase &&
            hasNumber &&
            hasSpecialChar;
        return valid ? null : { strongPasswordInvalid: true };
    }

    // Password validation helper methods (used in HTML)
    hasMinLength(password: string): boolean {
        return password ? password.length >= 8 : false;
    }

    hasLowercase(password: string): boolean {
        return password ? /(?=.*[a-z])/.test(password) : false;
    }

    hasUppercase(password: string): boolean {
        return password ? /(?=.*[A-Z])/.test(password) : false;
    }

    hasNumber(password: string): boolean {
        return password ? /(?=.*\d)/.test(password) : false;
    }

    hasSpecialChar(password: string): boolean {
        return password ? /(?=.*[@$!%*?&])/.test(password) : false;
    }

    private clearIndividualValidators(): void {
        this.registerForm.get('fullName')?.clearValidators();
        this.registerForm.get('email')?.clearValidators();
        this.registerForm.get('kraPin')?.clearValidators();
        this.registerForm.get('phoneNumber')?.clearValidators();
        this.registerForm.get('fullName')?.updateValueAndValidity();
        this.registerForm.get('email')?.updateValueAndValidity();
        this.registerForm.get('kraPin')?.updateValueAndValidity();
        this.registerForm.get('phoneNumber')?.updateValueAndValidity();
    }

    private setIndividualValidators(): void {
        this.registerForm
            .get('fullName')
            ?.setValidators([Validators.required, this.fullNameValidator]);
        this.registerForm
            .get('email')
            ?.setValidators([Validators.required, Validators.email]);
        this.registerForm
            .get('kraPin')
            ?.setValidators([Validators.required, this.kraPinValidator]);
        this.registerForm
            .get('phoneNumber')
            ?.setValidators([Validators.required, this.phoneNumberValidator]);
        this.registerForm.get('fullName')?.updateValueAndValidity();
        this.registerForm.get('email')?.updateValueAndValidity();
        this.registerForm.get('kraPin')?.updateValueAndValidity();
        this.registerForm.get('phoneNumber')?.updateValueAndValidity();
    }

    private clearIntermediaryValidators(): void {
        this.registerForm.get('iraNumber')?.clearValidators();
        this.registerForm.get('pinNumber')?.clearValidators();
        this.registerForm.get('iraNumber')?.updateValueAndValidity();
        this.registerForm.get('pinNumber')?.updateValueAndValidity();
    }

    private setIntermediaryValidators(): void {
        this.registerForm
            .get('iraNumber')
            ?.setValidators([
                Validators.required,
                Validators.pattern(/^[A-Za-z0-9]{5,15}$/),
            ]);
        this.registerForm
            .get('pinNumber')
            ?.setValidators([
                Validators.required,
                Validators.pattern(/^[A-Za-z0-9]{10}$/),
            ]);
        this.registerForm.get('iraNumber')?.updateValueAndValidity();
        this.registerForm.get('pinNumber')?.updateValueAndValidity();
    }

    // Input formatting methods
    onKraPinChange(event: any): void {
        let value = event.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9]/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        this.registerForm.get('kraPin')?.setValue(value);
    }

    onPhoneNumberChange(event: any): void {
        let value = event.target.value;
        value = value.replace(/[^\d+]/g, '');

        if (!value.startsWith('+254') && value.length > 0) {
            if (value.startsWith('0')) {
                value = '+254' + value.substring(1);
            } else if (value.startsWith('254')) {
                value = '+' + value;
            } else if (!value.startsWith('+')) {
                value = '+254' + value;
            }
        }

        if (value.length > 13) {
            value = value.substring(0, 13);
        }

        this.registerForm.get('phoneNumber')?.setValue(value);
    }

    // Password strength checker
    getPasswordStrength(password: string): PasswordStrength {
        if (!password) {
            return { level: 0, text: 'No password', color: 'text-gray-400' };
        }

        let score = 0;
        const checks = [
            password.length >= 8,
            /(?=.*[a-z])/.test(password),
            /(?=.*[A-Z])/.test(password),
            /(?=.*\d)/.test(password),
            /(?=.*[@$!%*?&])/.test(password),
        ];

        score = checks.filter((check) => check).length;

        const strengthLevels = [
            { level: 1, text: 'Very Weak', color: 'text-red-500' },
            { level: 2, text: 'Weak', color: 'text-red-500' },
            { level: 3, text: 'Fair', color: 'text-yellow-500' },
            { level: 4, text: 'Good', color: 'text-blue-500' },
            { level: 5, text: 'Strong', color: 'text-green-500' },
        ];

        return strengthLevels[Math.max(0, score - 1)] || strengthLevels[0];
    }

    signIn(): void {
        if (this.signInForm.invalid) {
            this.alert = {
                type: 'error',
                message:
                    'Please enter a valid email and password and accept the terms.',
                position: 'bottom',
            };
            this.showAlert = true;

            // Set a timeout to hide the alert message after 3 seconds
            setTimeout(() => {
                this.showAlert = false;
                this.alert = null; // Clear the alert message
            }, 3000); // 3000 milliseconds = 3 seconds
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
                this.alert = {
                    type: 'error',
                    message: 'Wrong email or password. Please try again.',
                    position: 'bottom',
                };
                this.showAlert = true;
                this.signInForm.enable();

                // Set a timeout to hide the toast message after 3 seconds
                setTimeout(() => {
                    this.showAlert = false;
                    this.alert = null; // Clear the alert message
                }, 3000); // 3000 milliseconds = 3 seconds
            }
        }, 1000); // This timeout is for the login process itself, not the toast display
    }

    register(): void {
        if (this.registerForm.invalid) {
            this.markAllAsTouched(this.registerForm);
            this.alert = {
                type: 'error',
                message: 'Please correct the highlighted errors.',
                position: 'bottom',
            };
            this.showAlert = true;
            return;
        }

        this.registerForm.disable();
        console.log('Registering user...', this.registerForm.value);

        setTimeout(() => {
            this.alert = {
                type: 'success',
                message: 'Registration successful! Please sign in.',
                position: 'bottom',
            };
            this.showAlert = true;
            this.formType = 'login';
            this.registerForm.enable();
            setTimeout(() => (this.showAlert = false), 5000);
        }, 1500);
    }

    private markAllAsTouched(formGroup: FormGroup): void {
        Object.values(formGroup.controls).forEach((control) => {
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
            day: 'numeric',
        });
    }
}
