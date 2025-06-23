import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-user-registration',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './marine-insurance.component.html',
    styleUrls: ['./marine-insurance.component.scss'],
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate(
                    '300ms ease-in',
                    style({ opacity: 1, transform: 'translateY(0)' })
                ),
            ]),
        ]),
    ],
})
export class UserRegistrationComponent implements OnInit {
    currentStep = 1;
    registrationForm: FormGroup;
    quoteForm: FormGroup;
    signInForm: FormGroup;
    paymentForm: FormGroup;

    hidePassword = true;
    signingIn = false;
    processing = false;
    isSignedIn = false;
    currentUser: any = null;
    today = new Date();
    nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));

    constructor(private fb: FormBuilder) {
        this.initializeForms();
    }

    ngOnInit(): void {}

    private initializeForms(): void {
        this.registrationForm = this.fb.group({
            userType: ['', Validators.required],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', Validators.required],
            location: ['', Validators.required],
        });

        this.quoteForm = this.fb.group({
            vesselType: ['', Validators.required],
            vesselValue: ['', [Validators.required, Validators.min(1)]],
            yearBuilt: ['', Validators.required],
            length: ['', [Validators.required, Validators.min(1)]],
            primaryUse: ['', Validators.required],
            hullCoverage: [false],
            liabilityCoverage: [false],
            cargoCoverage: [false],
            personalEffects: [false],
        });

        this.signInForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            rememberMe: [false],
        });

        this.paymentForm = this.fb.group({
            cardholderName: ['', Validators.required],
            cardNumber: ['', Validators.required],
            expiryDate: ['', Validators.required],
            cvv: ['', Validators.required],
            acceptTerms: [false, Validators.requiredTrue],
        });
    }

    nextStep(): void {
        if (this.currentStep < 5) {
            this.currentStep++;
        }
    }

    previousStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    generateQuote(): void {
        if (this.quoteForm.valid) {
            this.nextStep();
        }
    }

    signIn(): void {
        if (this.signInForm.valid) {
            this.signingIn = true;
            // Simulate API call
            setTimeout(() => {
                this.isSignedIn = true;
                this.currentUser = {
                    name: this.signInForm.get('email')?.value,
                    email: this.signInForm.get('email')?.value,
                };
                this.signingIn = false;
                this.nextStep();
            }, 2000);
        }
    }

    createAccount(): void {
        // Navigate to account creation or handle inline
        this.isSignedIn = true;
        this.currentUser = {
            name: this.registrationForm.get('fullName')?.value,
            email: this.registrationForm.get('email')?.value,
        };
        this.nextStep();
    }

    continueAsGuest(): void {
        this.nextStep();
    }

    completePurchase(): void {
        if (this.paymentForm.valid) {
            this.processing = true;
            // Simulate payment processing
            setTimeout(() => {
                this.processing = false;
                this.nextStep();
            }, 3000);
        }
    }

    calculatePremium(): number {
        const vesselValue = this.quoteForm.get('vesselValue')?.value || 0;
        const baseRate = 0.02; // 2% of vessel value
        let premium = vesselValue * baseRate;

        // Add coverage premiums
        if (this.quoteForm.get('hullCoverage')?.value) premium += 500;
        if (this.quoteForm.get('liabilityCoverage')?.value) premium += 300;
        if (this.quoteForm.get('cargoCoverage')?.value) premium += 200;
        if (this.quoteForm.get('personalEffects')?.value) premium += 100;

        return Math.round(premium);
    }

    generatePolicyNumber(): string {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }
}
