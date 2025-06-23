import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'auth-user-registration',
    standalone: true,
    templateUrl: './user-registration.component.html',
    styleUrls: ['./user-registration.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        CommonModule,
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatSelectModule,
    ],
})
export class UserRegistrationComponent implements OnInit {
    @ViewChild('registrationNgForm') registrationNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    registrationForm: UntypedFormGroup;
    showAlert: boolean = false;

    counties = [
        'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
        'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Meru', 'Nyeri', 'Kericho',
        'Embu', 'Migori', 'Homa Bay', 'Kilifi', 'Lamu', 'Isiolo', 'Marsabit',
        'Wajir', 'Mandera', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
        'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia',
        'Nyandarua', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Kajiado',
        'Makueni', 'Kitui', 'Tana River', 'Taita-Taveta', 'Kwale'
    ];

    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router
    ) {}

    ngOnInit(): void {
        this.registrationForm = this._formBuilder.group({
            registrationType: ['client', Validators.required],
            nationality: ['Kenya', Validators.required],
            countryOfResidence: ['Kenya'],
            idType: ['passport', Validators.required],
            passportNumber: ['', Validators.required],
            kenyanIdNumber: [''],
            firstName: ['', Validators.required],
            middleName: [''],
            lastName: ['', Validators.required],
            gender: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            telPrefix: ['+254'],
            telephoneNo: ['', [Validators.required, Validators.pattern(/^[17]\d{8}$/)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
            acceptTerms: [false, Validators.requiredTrue]
        });

        // Add custom validator for password confirmation
        this.registrationForm.addValidators(this.passwordMatchValidator);
    }

    /**
     * Password match validator
     */
    passwordMatchValidator = (form: UntypedFormGroup) => {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');
        
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }
        
        if (confirmPassword?.hasError('passwordMismatch')) {
            delete confirmPassword.errors['passwordMismatch'];
            if (Object.keys(confirmPassword.errors || {}).length === 0) {
                confirmPassword.setErrors(null);
            }
        }
        
        return null;
    };

    /**
     * Register user
     */
    register(): void {
        if (this.registrationForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        this.registrationForm.disable();
        this.showAlert = false;

        // Prepare registration data
        const registrationData = {
            ...this.registrationForm.value,
            phoneNumber: this.registrationForm.value.telPrefix + this.registrationForm.value.telephoneNo
        };

        this._authService.signUp(registrationData).subscribe(
            (response) => {
                this._router.navigateByUrl('/confirmation-required');
            },
            (error) => {
                this.registrationForm.enable();
                this.alert = {
                    type: 'error',
                    message: 'Registration failed. Please try again.',
                };
                this.showAlert = true;
            }
        );
    }

    /**
     * Mark all form fields as touched
     */
    private markFormGroupTouched(): void {
        Object.keys(this.registrationForm.controls).forEach(key => {
            const control = this.registrationForm.get(key);
            control?.markAsTouched();
        });
    }

    /**
     * Get error message for form fields
     */
    getErrorMessage(fieldName: string): string {
        const control = this.registrationForm.get(fieldName);
        
        if (control?.hasError('required')) {
            return `${this.getFieldDisplayName(fieldName)} is required`;
        }
        
        if (control?.hasError('email')) {
            return 'Please enter a valid email address';
        }
        
        if (control?.hasError('minlength')) {
            return `${this.getFieldDisplayName(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
        }
        
        if (control?.hasError('pattern') && fieldName === 'telephoneNo') {
            return 'Please enter a valid phone number (e.g., 712345678)';
        }
        
        if (control?.hasError('passwordMismatch')) {
            return 'Passwords do not match';
        }
        
        return '';
    }

    /**
     * Get display name for form fields
     */
    private getFieldDisplayName(fieldName: string): string {
        const displayNames: { [key: string]: string } = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            telephoneNo: 'Phone Number',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            passportNumber: 'Passport Number'
        };
        
        return displayNames[fieldName] || fieldName;
    }
}