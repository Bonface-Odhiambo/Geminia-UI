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
import { MatCheckboxModule } from '@angular/material/checkbox'; // Import for checkbox
import { MatRadioModule } from '@angular/material/radio'; // Import for radio buttons

// Assuming Fuse alert is shared. Adjust path if needed.
import { FuseAlertComponent } from '@fuse/components/alert'; 

// Define an interface for the alert object for type safety
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
        MatCheckboxModule, // Add module
        MatRadioModule,    // Add module
        FuseAlertComponent // Add FuseAlertComponent
    ],
})
export class AuthSignInComponent implements OnInit {
    // --- PROPERTIES FOR THE TEMPLATE ---
    showAlert: boolean = false;
    alert: Alert = { type: 'error', message: '' };
    signInForm: FormGroup;
    registerForm: FormGroup;
    formType: 'login' | 'register' = 'login';
    showPassword = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Initialize Sign-In Form
        this.signInForm = this.fb.group({
            username: ['individual@geminia.com', [Validators.required, Validators.email]],
            password: ['password123', Validators.required],
        });

        // Initialize Register Form
        this.registerForm = this.fb.group({
            accountType: ['individual', Validators.required],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            kraPin: [''],
            phoneNumber: [''],
            iraNumber: [''],
            pinNumber: [''],
            password: ['', Validators.required],
            agreementAccepted: [false, Validators.requiredTrue]
        });
    }

    // --- METHODS FOR THE TEMPLATE ---
    signIn(): void {
        if (this.signInForm.invalid) {
            return;
        }

        this.signInForm.disable(); // Disable form during submission
        this.showAlert = false;

        const { username, password } = this.signInForm.value;

        setTimeout(() => {
            const success = this.authService.login(username, password);

            if (success) {
                this.router.navigate(['/dashboard']);
            } else {
                // Show inline error alert
                this.alert = { type: 'error', message: 'Wrong email or password. Please try again.', position: 'inline' };
                this.showAlert = true;
                this.signInForm.enable(); // Re-enable form
            }
        }, 1000);
    }

    register(): void {
        if (this.registerForm.invalid) {
            return;
        }
        this.registerForm.disable();
        console.log('Registering user...', this.registerForm.value);
        // Implement registration logic here
        
        // On success, show a bottom toast and switch to login
        setTimeout(() => {
            this.alert = { type: 'success', message: 'Registration successful! Please sign in.', position: 'bottom' };
            this.showAlert = true;
            this.formType = 'login';
            this.registerForm.enable();
            // Hide the toast after a few seconds
            setTimeout(() => this.showAlert = false, 5000);
        }, 1500);
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }
}