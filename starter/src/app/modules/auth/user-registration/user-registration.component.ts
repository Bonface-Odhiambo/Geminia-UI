import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface PremiumCalculation {
  basePremium: number;
  addOnPremium: number;
  netPremium: number;
  ipl: number;
  trainingLevy: number;
  stampDuty: number;
  totalPayable: number;
  baseRate: number;
  currency: string;
}

@Component({
  selector: 'app-marine-cargo-quotation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './marine-cargo-quotation.component.html',
  styleUrls: ['./marine-cargo-quotation.component.css'],
})
export class MarineCargoQuotationComponent implements OnInit {
  quotationForm: FormGroup;
  paymentForm: FormGroup;
  currentStep: number = 1;
  isProcessingPayment: boolean = false;
  isLoggedIn: boolean = false; // Simulates user authentication status

  premiumCalculation: PremiumCalculation = {
    basePremium: 0,
    addOnPremium: 0,
    netPremium: 0,
    ipl: 0,
    trainingLevy: 0,
    stampDuty: 0,
    totalPayable: 0,
    baseRate: 0,
    currency: 'KES',
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
  }

  /**
   * Close the form and navigate back to /page
   */
  closeForm(): void {
    this.router.navigate(['/page']);
  }

  private createQuotationForm(): FormGroup {
    return this.fb.group({
      accountType: ['', Validators.required],
      tradeType: ['', Validators.required],
      modeOfShipment: ['', Validators.required],
      cargoType: ['', Validators.required],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      shippingDate: ['', Validators.required],
      currency: ['KES', Validators.required],
      coverType: ['ICC_A', Validators.required],
      sumInsured: ['', [Validators.required, Validators.min(1)]],
      descriptionOfGoods: ['', Validators.required],
      ucrNumber: [''],
      idfNumber: [''],
      concealedLossCover: [false],
      storageWarehouse: [false],
      warRisk: [false],
      generalAverage: [false],
      territorialExtension: [false],
      dataPrivacyConsent: [false, Validators.requiredTrue], // Added for privacy consent
    });
  }

  private createPaymentForm(): FormGroup {
    return this.fb.group({
      paymentMethod: ['', Validators.required],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      cardholderName: [''],
      phoneNumber: [''],
    });
  }

  private setupFormSubscriptions(): void {
    // Watch for changes to calculate premium
    this.quotationForm.valueChanges.subscribe(() => {
      const sumInsured = this.quotationForm.get('sumInsured')?.value;
      const currency = this.quotationForm.get('currency')?.value;

      if (sumInsured && sumInsured > 0) {
        this.calculatePremium(sumInsured, currency);
      } else {
        this.resetPremiumCalculation();
      }
    });

    // Setup payment method validation
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe((method) => {
      this.updatePaymentValidation(method);
    });
  }

  private calculatePremium(sumInsured: number, currency: string): void {
    let baseRate = 0.002; // 0.2% base rate

    // Adjust rate based on cargo type
    const cargoType = this.quotationForm.get('cargoType')?.value;
    switch (cargoType) {
      case 'hazardous': baseRate *= 2.5; break;
      case 'bulk': baseRate *= 1.8; break;
      case 'containerized': baseRate *= 1.3; break;
      case 'general': baseRate *= 1.2; break;
    }

    // Adjust rate based on mode of shipment
    const modeOfShipment = this.quotationForm.get('modeOfShipment')?.value;
    switch (modeOfShipment) {
      case 'air': baseRate *= 0.8; break; // Lower risk
      case 'sea': baseRate *= 1.0; break;
      case 'land': baseRate *= 1.1; break;
      case 'multimodal': baseRate *= 1.3; break;
    }

    const basePremium = sumInsured * baseRate;

    // Calculate add-on premiums
    let addOnRate = 0;
    if (this.quotationForm.get('warRisk')?.value) addOnRate += 0.001;
    if (this.quotationForm.get('concealedLossCover')?.value) addOnRate += 0.0005;
    if (this.quotationForm.get('storageWarehouse')?.value) addOnRate += 0.0003;
    if (this.quotationForm.get('generalAverage')?.value) addOnRate += 0.0002;
    if (this.quotationForm.get('territorialExtension')?.value) addOnRate += 0.0004;

    const addOnPremium = sumInsured * addOnRate;
    const netPremium = basePremium + addOnPremium;

    // Calculate Kenyan Insurance Taxes
    const ipl = netPremium * 0.0045; // 0.45% Insurance Premium Levy
    const trainingLevy = netPremium * 0.0025; // 0.25% Training Levy
    const stampDuty = currency === 'KES' ? 40 : 0; // KES 40 Stamp Duty, only for KES currency
    const totalPayable = netPremium + ipl + trainingLevy + stampDuty;

    this.premiumCalculation = {
      basePremium,
      addOnPremium,
      netPremium,
      ipl,
      trainingLevy,
      stampDuty,
      totalPayable,
      baseRate,
      currency,
    };
  }

  private resetPremiumCalculation(): void {
    this.premiumCalculation = {
      basePremium: 0,
      addOnPremium: 0,
      netPremium: 0,
      ipl: 0,
      trainingLevy: 0,
      stampDuty: 0,
      totalPayable: 0,
      baseRate: 0,
      currency: this.quotationForm.get('currency')?.value || 'KES',
    };
  }

  private updatePaymentValidation(method: string): void {
    // Clear all validators first
    this.paymentForm.get('cardNumber')?.clearValidators();
    this.paymentForm.get('expiryDate')?.clearValidators();
    this.paymentForm.get('cvv')?.clearValidators();
    this.paymentForm.get('cardholderName')?.clearValidators();
    this.paymentForm.get('phoneNumber')?.clearValidators();

    // Add validators based on payment method
    if (method === 'card') {
      this.paymentForm.get('cardNumber')?.setValidators([Validators.required]);
      this.paymentForm.get('expiryDate')?.setValidators([Validators.required]);
      this.paymentForm.get('cvv')?.setValidators([Validators.required]);
      this.paymentForm.get('cardholderName')?.setValidators([Validators.required]);
    } else if (method === 'mpesa') {
      this.paymentForm.get('phoneNumber')?.setValidators([Validators.required]);
    }

    // Update validity
    Object.keys(this.paymentForm.controls).forEach((key) => {
      this.paymentForm.get(key)?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.quotationForm.valid) {
      this.goToStep(2); // Go to review page
    } else {
      this.markFormGroupTouched(this.quotationForm);
    }
  }

  proceedToPayment(): void {
    if (this.isLoggedIn) {
      this.goToStep(3); // Logged-in user goes directly to payment
    } else {
      this.goToStep(4); // Logged-out user goes to login/register page
    }
  }

  login(): void {
    // Simulate a successful login
    this.isLoggedIn = true;
    alert('Login successful! Proceeding to payment.');
    this.goToStep(3); // After login, proceed to payment
  }

  processPayment(): void {
    if (this.paymentForm.valid) {
      this.isProcessingPayment = true;
      setTimeout(() => {
        this.isProcessingPayment = false;
        alert('Payment successful! Your marine cargo insurance policy has been issued.');
        this.resetForms();
      }, 3000);
    } else {
      this.markFormGroupTouched(this.paymentForm);
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
    window.scrollTo(0, 0);
  }

  downloadQuote(): void {
    alert('Downloading quote...');
  }

  saveQuote(): void {
    alert('Quote saved to your account!');
  }

  getCoverTypeDisplay(value: string): string {
    const coverTypes: { [key: string]: string } = {
      ICC_A: 'ICC (A) - All Risks',
      ICC_B: 'ICC (B) - With Average',
      ICC_C: 'ICC (C) - Free of Particular Average',
    };
    return coverTypes[value] || value;
  }

  getSelectedAddOns(): string[] {
    const addOns: string[] = [];
    if (this.quotationForm.get('concealedLossCover')?.value) addOns.push('Concealed Loss Cover');
    if (this.quotationForm.get('storageWarehouse')?.value) addOns.push('Storage & Warehouse');
    if (this.quotationForm.get('warRisk')?.value) addOns.push('War Risk');
    if (this.quotationForm.get('generalAverage')?.value) addOns.push('General Average');
    if (this.quotationForm.get('territorialExtension')?.value) addOns.push('Territorial Extension');
    return addOns;
  }

  generatePaymentReference(): string {
    return 'MCI-' + Date.now().toString().slice(-8);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private resetForms(): void {
    this.quotationForm.reset();
    this.paymentForm.reset();
    this.currentStep = 1;
    this.isLoggedIn = false; // Log user out on reset
    this.resetPremiumCalculation();
  }
}