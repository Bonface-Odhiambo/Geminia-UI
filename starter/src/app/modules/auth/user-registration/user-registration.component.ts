import { CommonModule, KeyValuePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface PremiumCalculation {
    basePremium: number;
    addOnPremium: number;
    netPremium: number;
    phcf: number;
    trainingLevy: number;
    stampDuty: number;
    totalPayable: number;
    baseRate: number;
    currency: string;
}

@Component({
    selector: 'app-marine-cargo-quotation',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, KeyValuePipe, RouterLink],
    templateUrl: './marine-cargo-quotation.component.html',
    styleUrls: ['./marine-cargo-quotation.component.scss'],
})
export class MarineCargoQuotationComponent implements OnInit {
    quotationForm: FormGroup;
    paymentForm: FormGroup;
    currentStep: number = 1;
    isExportMode: boolean = false;
    isProcessingPayment: boolean = false;
    isLoggedIn: boolean = false;

    readonly marineProductType = 'marine_cargo_insurance';
    readonly marineProductDisplayName = 'Marine Cargo Insurance';

    private readonly TAX_RATES = {
        PHCF: 0.0045, // 0.45%
        TRAINING_LEVY: 0.002, // 0.2%
        STAMP_DUTY: 40, // KES 40 flat rate
    };

    private productCategoryRates: { [key: string]: number } = {
        electronics: 0.0025,
        machinery: 0.003,
        pharmaceuticals: 0.0035,
        chemicals: 0.004,
        automotive: 0.0022,
        textiles: 0.002,
        general_merchandise: 0.002,
        canned_foods: 0.0018,
        food: 0.0018,
        raw_materials: 0.0015,
        furniture: 0.0025,
    };

    public productCategories: { [key: string]: string } = {
        electronics: 'Electronics',
        machinery: 'Machinery & Equipment',
        pharmaceuticals: 'Pharmaceuticals',
        chemicals: 'Chemical Products',
        automotive: 'Automotive Parts',
        textiles: 'Textiles & Clothing',
        general_merchandise: 'General Merchandise',
        food: 'Food & Beverages',
        raw_materials: 'Raw Materials',
        furniture: 'Furniture & Home Goods',
        canned_foods: 'Canned Foods',
    };

    premiumCalculation: PremiumCalculation = {
        basePremium: 0,
        addOnPremium: 0,
        netPremium: 0,
        phcf: 0,
        trainingLevy: 0,
        stampDuty: 0,
        totalPayable: 0,
        baseRate: 0,
        currency: 'Kshs',
    };

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.quotationForm = this.createQuotationForm();
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
            productType: [this.marineProductType],
            productCategory: ['', Validators.required],
            origin: ['', Validators.required],
            destination: [''], // No longer disabled, just a display div
            coverStartDate: [
                '',
                [Validators.required, this.noPastDatesValidator],
            ],
            currency: ['Kshs'],
            coverType: ['ICC_A', Validators.required],
            sumInsured: ['', [Validators.required, Validators.min(1)]],
            descriptionOfGoods: ['', Validators.required],
            idfNumber: ['', Validators.required],
            ucrNumber: ['', Validators.required],
            concealedLossCover: [false],
            storageWarehouse: [false],
            warRisk: [false],
            generalAverage: [false],
            territorialExtension: [false],
            termsAndConditions: [false, Validators.requiredTrue],
            dataPrivacyConsent: [false, Validators.requiredTrue],
        });
    }

    private createPaymentForm(): FormGroup {
        return this.fb.group({
            paymentMethod: ['', Validators.required],
            cardNumber: [''],
            expiryDate: [''],
            cvv: [''],
            phoneNumber: [''],
        });
    }

    private setDefaultDate(): void {
        this.quotationForm.patchValue({ coverStartDate: this.getToday() });
    }

    public getToday(): string {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    private noPastDatesValidator(
        control: AbstractControl
    ): { [key: string]: boolean } | null {
        if (!control.value) {
            return null;
        }
        // Compare date strings in 'YYYY-MM-DD' format to avoid timezone issues.
        if (
            control.value <
            new MarineCargoQuotationComponent(null, null).getToday()
        ) {
            return { pastDate: true };
        }
        return null;
    }

    private setupFormSubscriptions(): void {
        this.quotationForm.valueChanges.subscribe(() => {
            if (
                this.quotationForm.get('sumInsured')?.value > 0 &&
                this.quotationForm.get('productCategory')?.value &&
                !this.isExportMode
            ) {
                this.calculatePremium();
            } else {
                this.resetPremiumCalculation();
            }
        });

        this.quotationForm.get('tradeType')?.valueChanges.subscribe((value) => {
            this.isExportMode = value === 'export';
            Object.keys(this.quotationForm.controls).forEach((key) => {
                if (key !== 'tradeType') {
                    this.isExportMode
                        ? this.quotationForm.get(key)?.disable()
                        : this.quotationForm.get(key)?.enable();
                }
            });
        });

        this.quotationForm
            .get('modeOfShipment')
            ?.valueChanges.subscribe((mode) => {
                let destination = '';
                if (mode === 'sea') destination = 'Mombasa, Kenya';
                else if (mode === 'air') destination = 'Nairobi, JKIA';
                this.quotationForm.patchValue({ destination });
            });
    }

    private calculatePremium(): void {
        const formValues = this.quotationForm.getRawValue();
        let baseRate =
            this.productCategoryRates[formValues.productCategory] || 0.0025;
        if (formValues.coverType === 'ICC_B') baseRate *= 0.85;
        if (formValues.coverType === 'ICC_C') baseRate *= 0.7;

        const basePremium = formValues.sumInsured * baseRate;

        let addOnRate = 0;
        if (formValues.concealedLossCover) addOnRate += 0.0004;
        if (formValues.storageWarehouse) addOnRate += 0.0003;
        if (formValues.warRisk) addOnRate += 0.0005;
        if (formValues.generalAverage) addOnRate += 0.0002;
        if (formValues.territorialExtension) addOnRate += 0.0001;
        const addOnPremium = formValues.sumInsured * addOnRate;

        const netPremium = basePremium + addOnPremium;
        const phcf = netPremium * this.TAX_RATES.PHCF;
        const trainingLevy = netPremium * this.TAX_RATES.TRAINING_LEVY;
        const stampDuty = this.TAX_RATES.STAMP_DUTY;

        const totalPayable = netPremium + phcf + trainingLevy + stampDuty;

        this.premiumCalculation = {
            basePremium,
            addOnPremium,
            netPremium,
            phcf,
            trainingLevy,
            stampDuty,
            totalPayable,
            baseRate,
            currency: 'Kshs',
        };
    }

    private resetPremiumCalculation(): void {
        this.premiumCalculation = {
            basePremium: 0,
            addOnPremium: 0,
            netPremium: 0,
            phcf: 0,
            trainingLevy: 0,
            stampDuty: 0,
            totalPayable: 0,
            baseRate: 0,
            currency: 'Kshs',
        };
    }

    public getCoverTypeDisplay(value: string): string {
        const coverTypes: { [key: string]: string } = {
            ICC_A: 'ICC(A) - All Risks',
            ICC_B: 'ICC(B)',
            ICC_C: 'ICC(C)',
        };
        return coverTypes[value] || value;
    }

    onSubmit(): void {
        if (this.quotationForm.valid && !this.isExportMode) {
            this.goToStep(2);
        } else {
            this.quotationForm.markAllAsTouched();
        }
    }

    processPayment(): void {
        // Logic for processing payment
    }

    goToStep(step: number): void {
        this.currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
