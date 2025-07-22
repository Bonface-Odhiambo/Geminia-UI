import { CommonModule } from '@angular/common';
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
    basePremium: number;
    phcf: number;
    trainingLevy: number;
    stampDuty: number;
    totalPayable: number;
    currency: string;
}

interface MarineProduct {
    code: string;
    name: string;
    rate: number;
}

@Component({
    selector: 'app-marine-cargo-quotation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
    toastType: 'success' | 'info' = 'success'; // To control toast color
    isProcessingPayment: boolean = false;
    isLoggedIn: boolean = true; // Simulated authentication
    
    premiumCalculation: PremiumCalculation = this.resetPremiumCalculation();

    // --- Component Data ---
    readonly marineProducts: MarineProduct[] = [
        { code: 'ICC_A', name: 'Institute Cargo Clauses (A) - All Risks', rate: 0.0025 },
        { code: 'ICC_B', name: 'Institute Cargo Clauses (B) - Named Perils', rate: 0.0020 },
        { code: 'ICC_C', name: 'Institute Cargo Clauses (C) - Limited Perils', rate: 0.0018 },
    ];
    readonly marineCargoTypes: string[] = [
        'Pharmaceuticals & Medicines', 'Electronics & High-Tech Goods', 'Canned & Processed Foods', 'Apparel & Textiles', 
        'Automotive Parts & Vehicles', 'Industrial Machinery', 'Raw Materials (e.g., Ores, Logs)', 'Chemicals (Non-Hazardous)',
        'Furniture & Home Goods', 'Toys & Sporting Goods', 'Printed Materials & Books', 'Cosmetics & Personal Care', 'Frozen Goods'
    ];
    readonly blacklistedCountries: string[] = ['Belarus', 'Russia', 'Crimea', 'Ukraine', 'Israel', 'Yemen', 'Palestine', 'Sudan', 'DRC Congo', 'Somalia'];
    readonly countryList: string[] = ['Shanghai, China', 'Singapore, Singapore', 'Dubai, UAE', ...this.blacklistedCountries];
    readonly allCountries: string[] = ['Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Australia', 'Brazil', 'Canada', 'China', 'Egypt', 'France', 'Germany', 'India', 'Indonesia', 'Iran', 'Japan', 'Mexico', 'Nigeria', 'Pakistan', 'Saudi Arabia', 'South Africa', 'Turkey', 'United Kingdom', 'United States'];
    private readonly TAX_RATES = { PHCF: 0.0045, TRAINING_LEVY: 0.002, STAMP_DUTY: 40 };

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
             tradeType: ['', Validators.required],
             modeOfShipment: ['', Validators.required],
             marineProduct: ['Institute Cargo Clauses (A) - All Risks', Validators.required],
             marineCargoType: ['', Validators.required],
             origin: ['', Validators.required],
             destination: [{ value: '', disabled: true }],
             coverStartDate: ['', [Validators.required, this.noPastDatesValidator]],
             sumInsured: ['', [Validators.required, Validators.min(1)]],
             descriptionOfGoods: ['', Validators.required],
             idfNumber: ['', Validators.required],
             ucrNumber: ['', Validators.required],
        });
    }

    private createClientDetailsForm(): FormGroup {
        return this.fb.group({
            idNumber: ['', Validators.required],
            kraPin: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,12}$')]],
            termsAndConditions: [false, Validators.requiredTrue],
            dataPrivacyConsent: [false, Validators.requiredTrue],
        });
    }

    private createExportRequestForm(): FormGroup {
        return this.fb.group({
            kraPin: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,12}$')]],
            marineProduct: ['Institute Cargo Clauses (A) - All Risks', Validators.required],
            marineCargoType: ['', Validators.required],
            idfNumber: ['', Validators.required],
            ucrNumber: ['', Validators.required],
            originCountry: [{ value: 'Kenya', disabled: true }],
            destinationCountry: ['', Validators.required],
            shipmentDate: ['', [Validators.required, this.noPastDatesValidator]],
            goodsDescription: ['', [Validators.required, maxWords(100)]],
            termsAndConditions: [false, Validators.requiredTrue],
            dataPrivacyConsent: [false, Validators.requiredTrue],
        });
    }
    
    private createHighRiskRequestForm(): FormGroup {
        return this.fb.group({
            kraPin: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,12}$')]],
            marineProduct: ['Institute Cargo Clauses (A) - All Risks', Validators.required],
            marineCargoType: ['', Validators.required],
            idfNumber: ['', Validators.required],
            ucrNumber: ['', Validators.required],
            originCountry: [{ value: '', disabled: true }],
            destinationCountry: [{ value: 'Kenya', disabled: true }],
            shipmentDate: ['', [Validators.required, this.noPastDatesValidator]],
            goodsDescription: ['', [Validators.required, maxWords(100)]],
            termsAndConditions: [false, Validators.requiredTrue],
            dataPrivacyConsent: [false, Validators.requiredTrue],
        });
    }

    private createPaymentForm(): FormGroup {
        return this.fb.group({
            paymentMethod: ['mpesa', Validators.required],
            phoneNumber: ['', [Validators.required, Validators.pattern('^2547[0-9]{8}$')]],
            cardNumber: [''], expiryDate: [''], cvv: ['']
        });
    }

    private setDefaultDate(): void {
        this.quotationForm.patchValue({ coverStartDate: this.getToday() });
    }

    private setupFormSubscriptions(): void {
        // No subscription needed for premium calculation here anymore
        this.quotationForm.get('tradeType')?.valueChanges.subscribe(type => { if (type === 'export') this.showExportModal = true; });
        this.quotationForm.get('origin')?.valueChanges.subscribe(country => { if (this.blacklistedCountries.includes(country)) { this.highRiskRequestForm.patchValue({ originCountry: country }); this.showHighRiskModal = true; } });
        this.quotationForm.get('modeOfShipment')?.valueChanges.subscribe(mode => { this.quotationForm.patchValue({ destination: mode === 'sea' ? 'Mombasa, Kenya' : (mode === 'air' ? 'Nairobi, JKIA' : '') }); });

        this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
            const phoneControl = this.paymentForm.get('phoneNumber');
            const cardControls = [this.paymentForm.get('cardNumber'), this.paymentForm.get('expiryDate'), this.paymentForm.get('cvv')];
            if (method === 'mpesa') {
                phoneControl?.setValidators([Validators.required, Validators.pattern('^2547[0-9]{8}$')]);
                cardControls.forEach(c => c?.clearValidators());
            } else {
                phoneControl?.clearValidators();
                cardControls.forEach(c => c?.setValidators([Validators.required]));
            }
            phoneControl?.updateValueAndValidity();
            cardControls.forEach(c => c?.updateValueAndValidity());
        });
    }

    private calculatePremium(): void {
        const sumInsured = this.quotationForm.get('sumInsured')?.value || 0;
        const productValue = this.quotationForm.get('marineProduct')?.value;
        const selectedProduct = this.marineProducts.find(p => p.name === productValue || p.code === productValue);
        const rate = selectedProduct ? selectedProduct.rate : 0;

        const basePremium = sumInsured * rate;
        const { PHCF, TRAINING_LEVY, STAMP_DUTY } = this.TAX_RATES;
        const phcf = basePremium * PHCF;
        const trainingLevy = basePremium * TRAINING_LEVY;
        const totalPayable = basePremium + phcf + trainingLevy + STAMP_DUTY;

        this.premiumCalculation = { basePremium, phcf, trainingLevy, stampDuty: STAMP_DUTY, totalPayable, currency: 'Kshs' };
    }

    private resetPremiumCalculation(): PremiumCalculation {
        return { basePremium: 0, phcf: 0, trainingLevy: 0, stampDuty: 0, totalPayable: 0, currency: 'Kshs' };
    }

    // --- Modal Handlers & Submissions ---
    onExportRequestSubmit(): void { if (this.exportRequestForm.valid) { this.closeExportModal(); this.showToast("Thank you for submitting the export details. Our underwriter will contact you shortly.", 'info'); } }
    closeExportModal(): void { this.showExportModal = false; this.quotationForm.get('tradeType')?.reset(''); this.exportRequestForm.reset({ originCountry: 'Kenya', marineProduct: 'Institute Cargo Clauses (A) - All Risks', marineCargoType: '' }); }

    onHighRiskRequestSubmit(): void { if (this.highRiskRequestForm.valid) { this.closeHighRiskModal(); this.showToast("Your request for a high-risk shipment has been submitted for review.", 'info'); } }
    closeHighRiskModal(): void { this.showHighRiskModal = false; this.quotationForm.get('origin')?.reset(''); this.highRiskRequestForm.reset({ destinationCountry: 'Kenya', marineProduct: 'Institute Cargo Clauses (A) - All Risks', marineCargoType: '' }); }
    
    closePaymentModal(): void { this.showPaymentModal = false; this.isProcessingPayment = false; this.paymentForm.reset({ paymentMethod: 'mpesa' }); }
    
    private showToast(message: string, type: 'success' | 'info' = 'success'): void { 
        this.toastMessage = message; 
        this.toastType = type;
        setTimeout(() => {
            this.toastMessage = '';
            this.toastType = 'success'; // Reset to default
        }, 5000); 
    }

    // --- Main Form Actions ---
    onSubmit(): void { 
        if (this.quotationForm.valid) { 
            const tradeType = this.quotationForm.get('tradeType')?.value; 
            const origin = this.quotationForm.get('origin')?.value; 
            if (tradeType === 'import' && !this.blacklistedCountries.includes(origin)) { 
                this.calculatePremium(); // Calculate premium before moving to step 2
                this.goToStep(2); 
            } 
        } else { 
            this.quotationForm.markAllAsTouched(); 
        } 
    }
    
    downloadQuote(): void { if (this.clientDetailsForm.valid) { console.log('Client details submitted:', this.clientDetailsForm.value); this.showToast('Quote download initiated and details submitted.'); setTimeout(() => this.closeForm(), 2000); } }

    handlePayment(): void {
        if (!this.clientDetailsForm.valid) { this.clientDetailsForm.markAllAsTouched(); return; }
        console.log('Client details submitted:', this.clientDetailsForm.value);
        if (this.isLoggedIn) { this.showPaymentModal = true; }
        else { this.router.navigate(['/sign-in']); }
    }

    onProcessPayment(): void {
        if (this.paymentForm.valid) {
            this.isProcessingPayment = true;
            console.log('Processing payment with details:', this.paymentForm.value);
            setTimeout(() => {
                this.closePaymentModal();
                this.showToast("Payment successful! Your policy documents have been sent to your email.");
                setTimeout(() => this.closeForm(), 2000);
            }, 2500);
        }
    }

    // --- Utility & Navigation ---
    closeForm(): void { this.router.navigate(['/']); }
    getToday(): string { return new Date().toISOString().split('T')[0]; }
    noPastDatesValidator(control: AbstractControl): { [key: string]: boolean } | null { if (!control.value) return null; return control.value < new Date().toISOString().split('T')[0] ? { pastDate: true } : null; }
    goToStep(step: number): void { this.currentStep = step; }
}