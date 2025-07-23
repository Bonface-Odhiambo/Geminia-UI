import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Custom validator for word count
export function maxWords(max: number) {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;
    const words = control.value.trim().split(/\s+/).length;
    return words > max ? { 'maxWords': { maxWords: max, actualWords: words } } : null;
  };
}

// --- Interfaces for Data Structures ---
interface PremiumCalculation {
    basePremium: number; phcf: number; trainingLevy: number;
    stampDuty: number; commission: number; totalPayable: number; currency: string;
}
interface MarineProduct { code: string; name: string; rate: number; }
interface User { type: 'individual' | 'intermediary'; name: string; }
interface ImporterDetails { name: string; kraPin: string; }

@Component({
    selector: 'app-marine-cargo-quotation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DecimalPipe],
    templateUrl: './marine-cargo-quotation.component.html',
    styleUrls: ['./marine-cargo-quotation.component.scss'],
})
export class MarineCargoQuotationComponent implements OnInit {
    // --- Form Group Declarations ---
    quotationForm: FormGroup;
    clientDetailsForm: FormGroup;
    exportRequestForm: FormGroup;
    highRiskRequestForm: FormGroup;
    paymentForm: FormGroup;
    
    // --- State Management Properties ---
    currentStep: number = 1;
    showExportModal: boolean = false;
    showHighRiskModal: boolean = false;
    showPaymentModal: boolean = false;
    toastMessage: string = '';
    toastType: 'success' | 'info' | 'error' = 'success';
    isProcessingPayment: boolean = false;
    paymentTransactionId: string = '';
    
    // --- User and Importer Data ---
    currentUser: User = { type: 'individual', name: 'Individual User' };
    importerDetails: ImporterDetails = { name: '', kraPin: '' };
    
    premiumCalculation: PremiumCalculation = this.resetPremiumCalculation();

    // --- Component Data ---
    readonly marineProducts: MarineProduct[] = [
        { code: 'ICC_A', name: 'Institute Cargo Clauses (A) - All Risks', rate: 0.005 },
        { code: 'ICC_B', name: 'Institute Cargo Clauses (B) - Named Perils', rate: 0.0035 },
        { code: 'ICC_C', name: 'Institute Cargo Clauses (C) - Limited Perils', rate: 0.0025 },
    ];
    readonly marineCargoTypes: string[] = ['Pharmaceuticals', 'Electronics', 'Apparel', 'Vehicles', 'Machinery', 'General Goods'];
    readonly blacklistedCountries: string[] = ['Russia', 'Ukraine', 'North Korea', 'Syria', 'Iran', 'Yemen', 'Sudan', 'Somalia'];
    readonly allCountriesList: string[] = [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
        'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
        'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo, Democratic Republic of the', 'Congo, Republic of the', 'Costa Rica', 'Cote d\'Ivoire', 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
        'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
        'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
        'Fiji', 'Finland', 'France',
        'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
        'Haiti', 'Honduras', 'Hungary',
        'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
        'Jamaica', 'Japan', 'Jordan',
        'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
        'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
        'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
        'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
        'Oman',
        'Pakistan', 'Palau', 'Palestine State', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
        'Qatar',
        'Romania', 'Russia', 'Rwanda',
        'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
        'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
        'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States of America', 'Uruguay', 'Uzbekistan',
        'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
        'Yemen',
        'Zambia', 'Zimbabwe'
    ];
    private readonly TAX_RATES = { PHCF: 0.00525, TRAINING_LEVY: 0.0025, STAMP_DUTY: 40, COMMISSION_RATE: 0.10 };

    constructor(private fb: FormBuilder, private router: Router) {
        this.quotationForm = this.createQuotationForm();
        this.clientDetailsForm = this.createClientDetailsForm();
        this.exportRequestForm = this.createExportRequestForm();
        this.highRiskRequestForm = this.createHighRiskRequestForm();
        this.paymentForm = this.createPaymentForm();
    }

    ngOnInit(): void {
        this.setupFormSubscriptions();
        this.setDefaultDate();
    }

    private createQuotationForm(): FormGroup {
        return this.fb.group({
             cargoType: ['', Validators.required],
             tradeType: ['import', Validators.required],
             modeOfShipment: ['', Validators.required],
             marineProduct: ['Institute Cargo Clauses (A) - All Risks', Validators.required],
             marineCargoType: ['', Validators.required],
             origin: ['', Validators.required],
             destination: [''], // No longer disabled, will be set programmatically
             coverStartDate: ['', [Validators.required, this.noPastDatesValidator]],
             sumInsured: ['', [Validators.required, Validators.min(10000)]],
             descriptionOfGoods: ['', Validators.required],
             ucrNumber: ['', [Validators.required, Validators.pattern('^UCR\\d{7,}$')]],
             idfNumber: ['', [Validators.required, Validators.pattern('^E\\d{9,}$')]],
        });
    }

    private createClientDetailsForm(): FormGroup {
        return this.fb.group({
            idNumber: ['', Validators.required], kraPin: ['', Validators.required],
            firstName: ['', Validators.required], lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', [Validators.required, Validators.pattern('^07[0-9]{8}$')]],
            termsAndConditions: [false, Validators.requiredTrue], dataPrivacyConsent: [false, Validators.requiredTrue],
        });
    }

    private createModalForm(): FormGroup { 
        return this.fb.group({
            kraPin: ['', Validators.required], firstName: ['', Validators.required], lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]], phoneNumber: ['', [Validators.required, Validators.pattern('^07[0-9]{8}$')]],
            marineProduct: ['Institute Cargo Clauses (A) - All Risks', Validators.required], marineCargoType: ['', Validators.required],
            idfNumber: ['', Validators.required], ucrNumber: ['', Validators.required],
            originCountry: ['', Validators.required], destinationCountry: ['', Validators.required],
            shipmentDate: ['', [Validators.required, this.noPastDatesValidator]],
            goodsDescription: ['', [Validators.required, maxWords(100)]],
            termsAndConditions: [false, Validators.requiredTrue], dataPrivacyConsent: [false, Validators.requiredTrue],
        });
    }
    
    private createExportRequestForm(): FormGroup {
        const form = this.createModalForm();
        form.get('originCountry')?.patchValue('Kenya'); 
        form.get('originCountry')?.disable(); // Can still be disabled here as it's a fixed value in this context
        return form;
    }

    private createHighRiskRequestForm(): FormGroup {
        return this.createModalForm();
    }

    private createPaymentForm(): FormGroup {
        return this.fb.group({
            paymentMethod: ['mpesa', Validators.required],
            mpesaPhoneNumber: ['', [Validators.required, Validators.pattern('^2547[0-9]{8}$')]],
        });
    }

    private setDefaultDate(): void {
        this.quotationForm.patchValue({ coverStartDate: this.getToday() });
    }

    private setupFormSubscriptions(): void {
        this.quotationForm.get('modeOfShipment')?.valueChanges.subscribe(mode => {
            const destControl = this.quotationForm.get('destination');
            if (mode === 'sea') {
                destControl?.setValue('Mombasa, Kenya');
            } else if (mode === 'air') {
                destControl?.setValue('JKIA, Nairobi, Kenya');
            } else {
                destControl?.setValue('');
            }
        });

        this.quotationForm.get('tradeType')?.valueChanges.subscribe(type => { if (type === 'export') { this.showExportModal = true; }});
        this.quotationForm.get('origin')?.valueChanges.subscribe(country => { if (this.blacklistedCountries.includes(country)) { this.highRiskRequestForm.patchValue({ originCountry: country }); this.showHighRiskModal = true; } });
        this.quotationForm.get('ucrNumber')?.valueChanges.subscribe(ucr => {
            if (this.quotationForm.get('ucrNumber')?.valid) {
                this.importerDetails = { name: 'Global Imports Ltd.', kraPin: 'P051234567X' };
            } else {
                this.importerDetails = { name: '', kraPin: '' };
            }
        });
    }

    private calculatePremium(): void {
        const sumInsured = this.quotationForm.get('sumInsured')?.value || 0;
        const productValue = this.quotationForm.get('marineProduct')?.value;
        const selectedProduct = this.marineProducts.find(p => p.name === productValue);
        const rate = selectedProduct ? selectedProduct.rate : 0;
        const basePremium = sumInsured * rate;
        const { PHCF, TRAINING_LEVY, STAMP_DUTY, COMMISSION_RATE } = this.TAX_RATES;
        const phcf = basePremium * PHCF;
        const trainingLevy = basePremium * TRAINING_LEVY;
        const commission = this.currentUser.type === 'intermediary' ? basePremium * COMMISSION_RATE : 0;
        const totalPayable = basePremium + phcf + trainingLevy + STAMP_DUTY;
        this.premiumCalculation = { basePremium, phcf, trainingLevy, stampDuty: STAMP_DUTY, commission, totalPayable, currency: 'KES' };
    }

    private resetPremiumCalculation(): PremiumCalculation {
        return { basePremium: 0, phcf: 0, trainingLevy: 0, stampDuty: 0, commission: 0, totalPayable: 0, currency: 'KES' };
    }

    onExportRequestSubmit(): void { if (this.exportRequestForm.valid) { this.closeAllModals(); this.showToast("Export request submitted. Our underwriter will contact you.", 'info'); } }
    onHighRiskRequestSubmit(): void { if (this.highRiskRequestForm.valid) { this.closeAllModals(); this.showToast("High-risk shipment request submitted for review.", 'info'); } }
    
    closeAllModals(): void {
        this.showExportModal = false;
        this.showHighRiskModal = false;
        this.quotationForm.get('tradeType')?.setValue('import', { emitEvent: false });
        this.quotationForm.get('origin')?.setValue('', { emitEvent: false });
        this.exportRequestForm.reset({ marineProduct: 'Institute Cargo Clauses (A) - All Risks', originCountry: 'Kenya' });
        this.highRiskRequestForm.reset({ marineProduct: 'Institute Cargo Clauses (A) - All Risks' });
    }

    closePaymentModal(): void { this.showPaymentModal = false; this.isProcessingPayment = false; this.paymentTransactionId = ''; this.paymentForm.reset({ paymentMethod: 'mpesa' }); }
    
    private showToast(message: string, type: 'success' | 'info' | 'error' = 'success'): void { this.toastMessage = message; this.toastType = type; setTimeout(() => this.toastMessage = '', 5000); }

    onSubmit(): void { if (this.quotationForm.valid) { if (!this.showHighRiskModal && !this.showExportModal) { this.calculatePremium(); this.goToStep(2); } } else { this.quotationForm.markAllAsTouched(); } }
    downloadQuote(): void { if (this.clientDetailsForm.valid) { this.showToast('Quote download initiated successfully.'); } }

    handlePayment(): void {
        if (!this.clientDetailsForm.valid) { this.clientDetailsForm.markAllAsTouched(); return; }
        this.paymentTransactionId = `GEM${Date.now()}`;
        this.showPaymentModal = true;
    }

    onProcessSTKPush(): void {
        if (this.paymentForm.get('mpesaPhoneNumber')?.invalid) { this.paymentForm.get('mpesaPhoneNumber')?.markAsTouched(); return; }
        this.isProcessingPayment = true;
        this.showToast('Sending a payment request to your phone...', 'info');
        setTimeout(() => {
            this.isProcessingPayment = false;
            this.showToast('STK push sent. Please enter your PIN to complete payment.', 'success');
        }, 3000);
    }
    
    onProcessCardPayment(): void {
        this.showToast("Redirecting to our secure payment gateway...", 'info');
        setTimeout(() => window.open('https://www.example.com/payment-gateway', '_blank'), 1500);
    }

    verifyMpesaPayment(): void {
        this.showToast("Verifying your manual payment...", 'info');
        setTimeout(() => {
            this.closePaymentModal();
            this.showToast("Payment successful! Your certificate is ready.", 'success');
            setTimeout(() => this.downloadCertificate(), 1500);
        }, 2000);
    }
    
    downloadCertificate(): void { this.showToast("Your policy certificate has been downloaded.", 'success'); console.log("Certificate download process initiated."); setTimeout(() => this.closeForm(), 2000); }

    closeForm(): void { this.router.navigate(['/']); }
    getToday(): string { return new Date().toISOString().split('T')[0]; }
    noPastDatesValidator(control: AbstractControl): { [key: string]: boolean } | null { if (!control.value) return null; return control.value < new Date().toISOString().split('T')[0] ? { pastDate: true } : null; }
    goToStep(step: number): void { this.currentStep = step; }

    switchUser(event: any): void {
        const userType = event.target.value as 'individual' | 'intermediary';
        this.currentUser = { type: userType, name: userType === 'intermediary' ? 'Intermediary User' : 'Individual User' };
        this.showToast(`Switched to ${this.currentUser.name} view.`, 'info');
        if (this.currentStep === 2) { this.calculatePremium(); }
    }
}