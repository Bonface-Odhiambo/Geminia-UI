import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-marine-cargo-quotation',
    templateUrl: './marine-cargo-quotation.component.html',
    styleUrls: ['./marine-cargo-quotation.component.scss']
})
export class MarineCargoQuotationComponent implements OnInit {
    quotationForm: FormGroup;
    clientDetailsForm: FormGroup;
    currentStep = 1;
    showExportModal = false;
    showHighRiskModal = false;
    currentUser: any = {};
    premiumCalculation: any = {};
    importerDetails: any = {};
    marineProducts: any[] = [];
    marineCargoTypes: any[] = [];
    allCountriesList: string[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        this.initializeForms();
    }

    ngOnInit(): void {
        // Initialize your component
    }

    private initializeForms(): void {
        this.quotationForm = this.formBuilder.group({
            cargoType: ['', Validators.required],
            modeOfShipment: ['', Validators.required],
            tradeType: ['import'],
            marineProduct: ['', Validators.required],
            marineCargoType: ['', Validators.required],
            origin: ['', Validators.required],
            destination: ['Kenya'],
            ucrNumber: ['', Validators.required],
            idfNumber: ['', Validators.required],
            coverStartDate: ['', Validators.required],
            sumInsured: ['', [Validators.required, Validators.min(0)]],
            descriptionOfGoods: ['', Validators.required]
        });

        this.clientDetailsForm = this.formBuilder.group({
            idNumber: ['', Validators.required],
            kraPin: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', Validators.required],
            termsAndConditions: [false, Validators.requiredTrue],
            dataPrivacyConsent: [false, Validators.requiredTrue]
        });
    }

    closeAllModals(): void {
        // Check if user is logged in
        if (this.authService.isLoggedIn()) {
            // If logged in, redirect to dashboard
            this.router.navigate(['/dashboard']);
        } else {
            // If not logged in, redirect to homepage
            this.router.navigate(['/']);
        }
    }

    goToStep(step: number): void {
        this.currentStep = step;
    }

    onSubmit(): void {
        if (this.quotationForm.valid) {
            this.currentStep = 2;
        }
    }

    downloadQuote(): void {
        // Implementation for downloading quote
    }

    handlePayment(): void {
        // Implementation for payment handling
    }

    getToday(): string {
        return new Date().toISOString().split('T')[0];
    }
}
