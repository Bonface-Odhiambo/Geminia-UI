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
  isLoggedIn: boolean = false;

  // Product rates mapping with individual insurance policy rates
  private productRates: { [key: string]: number } = {
    electronics: 0.0025,        // 0.25%
    textiles: 0.0020,          // 0.20%
    machinery: 0.0030,         // 0.30%
    food: 0.0018,              // 0.18%
    pharmaceuticals: 0.0035,   // 0.35%
    automotive: 0.0022,        // 0.22%
    raw_materials: 0.0015,     // 0.15%
    furniture: 0.0025,         // 0.25%
    chemicals: 0.0040,         // 0.40%
    general_merchandise: 0.0020 // 0.20%
  };

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
    this.setDefaultDate();
  }

  /**
   * Close the form and navigate back to homepage
   */
  closeForm(): void {
    this.router.navigate(['/']);
  }

  /**
   * Create the quotation form with all required fields and validators
   */
  private createQuotationForm(): FormGroup {
    return this.fb.group({
      // New containerized/non-containerized selection
      containerType: ['', Validators.required],
      
      // Modified trade type - only import (domestic and export hidden)
      tradeType: ['import', Validators.required],
      
      // Mode of shipment - only sea (land and multimodal removed)
      modeOfShipment: ['sea', Validators.required],
      
      // Cargo type moved to where Mode of Shipment was
      cargoType: ['', Validators.required],
      
      // New product type dropdown (replaced old cargo type position)
      productType: ['', Validators.required],
      
      // Location and date fields
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      
      // Changed to text input for cursor visibility
      shippingDate: ['', [Validators.required, this.dateValidator]],
      
      // Currency and coverage
      currency: ['KES', Validators.required],
      
      // Cover type - only All Risks
      coverType: ['ICC_A', Validators.required],
      
      // Sum insured
      sumInsured: ['', [Validators.required, Validators.min(1)]],
      
      // Description of goods
      descriptionOfGoods: ['', Validators.required],
      
      // IDF number - now mandatory for imports (UCR hidden)
      idfNumber: ['', Validators.required],
      
      // Optional add-ons
      concealedLossCover: [false],
      storageWarehouse: [false],
      warRisk: [false],
      generalAverage: [false],
      territorialExtension: [false],
      
      // New optional dashboard alerts
      dashboardAlerts: [false],
      
      // Terms and conditions agreement (new)
      termsAndConditions: [false, Validators.requiredTrue],
      
      // Data privacy consent
      dataPrivacyConsent: [false, Validators.requiredTrue],
    });
  }

  /**
   * Create the payment form
   */
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

  /**
   * Set default date to today in DD/MM/YYYY format
   */
  private setDefaultDate(): void {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayFormatted = `${dd}/${mm}/${yyyy}`;
    
    this.quotationForm.patchValue({
      shippingDate: todayFormatted
    });
  }

  /**
   * Custom validator for DD/MM/YYYY date format
   */
  private dateValidator(control: any) {
    if (!control.value) return null;
    
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    
    if (!dateRegex.test(control.value)) {
      return { invalidDate: true };
    }
    
    // Additional validation for valid date
    const parts = control.value.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month - 1, day);
    
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return { invalidDate: true };
    }
    
    return null;
  }

  /**
   * Setup form subscriptions for real-time calculations
   */
  private setupFormSubscriptions(): void {
    // Watch for changes to calculate premium
    this.quotationForm.valueChanges.subscribe(() => {
      const sumInsured = this.quotationForm.get('sumInsured')?.value;
      const currency = this.quotationForm.get('currency')?.value;
      const productType = this.quotationForm.get('productType')?.value;

      if (sumInsured && sumInsured > 0 && productType) {
        this.calculatePremium(sumInsured, currency, productType);
      } else {
        this.resetPremiumCalculation();
      }
    });

    // Setup payment method validation
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe((method) => {
      this.updatePaymentValidation(method);
    });
  }

  /**
   * Calculate premium based on product type and other factors
   */
  private calculatePremium(sumInsured: number, currency: string, productType: string): void {
    // Get base rate from product type with individual rates
    let baseRate = this.productRates[productType] || 0.0020;

    // Adjust rate based on container type
    const containerType = this.quotationForm.get('containerType')?.value;
    if (containerType === 'non-containerized') {
      baseRate *= 1.2; // 20% increase for non-containerized
    }

    // Adjust rate based on cargo type
    const cargoType = this.quotationForm.get('cargoType')?.value;
    switch (cargoType) {
      case 'hazardous': 
        baseRate *= 2.0; 
        break;
      case 'bulk': 
        baseRate *= 1.5; 
        break;
      case 'containerized': 
        baseRate *= 1.0; 
        break;
      case 'general': 
        baseRate *= 1.1; 
        break;
      default:
        baseRate *= 1.0;
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
    const stampDuty = currency === 'KES' ? 40 : 0; // KES 40 Stamp Duty
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

  /**
   * Reset premium calculation
   */
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

  /**
   * Update payment form validation based on selected method
   */
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

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.quotationForm.valid) {
      this.goToStep(2);
    } else {
      this.markFormGroupTouched(this.quotationForm);
      console.log('Form is invalid:', this.quotationForm.errors);
    }
  }

  /**
   * Proceed to payment step
   */
  proceedToPayment(): void {
    if (this.isLoggedIn) {
      this.goToStep(3);
    } else {
      // Redirect to login page
      this.router.navigate(['/sign-in']);
    }
  }

  /**
   * Simulate login process
   */
  login(): void {
    this.isLoggedIn = true;
    alert('Login successful! Proceeding to payment.');
    this.goToStep(3);
  }

  /**
   * Process payment
   */
  processPayment(): void {
    if (this.paymentForm.valid) {
      this.isProcessingPayment = true;
      
      // Simulate payment processing
      setTimeout(() => {
        this.isProcessingPayment = false;
        alert('Payment successful! Your marine cargo insurance policy has been issued.');
        this.resetForms();
        this.router.navigate(['/dashboard']);
      }, 3000);
    } else {
      this.markFormGroupTouched(this.paymentForm);
    }
  }

  /**
   * Navigate to specific step
   */
  goToStep(step: number): void {
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Download quote as PDF
   */
  downloadQuote(): void {
    const quoteData = {
      ...this.quotationForm.value,
      premium: this.premiumCalculation,
      quoteDate: new Date().toISOString(),
      quoteId: this.generatePaymentReference()
    };
    
    console.log('Downloading quote:', quoteData);
    alert('Quote download started...');
  }

  /**
   * Save quote to user account
   */
  saveQuote(): void {
    const quoteData = {
      ...this.quotationForm.value,
      premium: this.premiumCalculation,
      savedDate: new Date().toISOString(),
      quoteId: this.generatePaymentReference()
    };
    
    console.log('Saving quote:', quoteData);
    alert('Quote saved to your account!');
  }

  /**
   * Get display name for product type
   */
  getProductTypeDisplay(value: string): string {
    const productTypes: { [key: string]: string } = {
      electronics: 'Electronics',
      textiles: 'Textiles & Clothing',
      machinery: 'Machinery & Equipment',
      food: 'Food & Beverages',
      pharmaceuticals: 'Pharmaceuticals',
      automotive: 'Automotive Parts',
      raw_materials: 'Raw Materials',
      furniture: 'Furniture & Home Goods',
      chemicals: 'Chemical Products',
      general_merchandise: 'General Merchandise',
    };
    return productTypes[value] || value;
  }

  /**
   * Get display name for cover type
   */
  getCoverTypeDisplay(value: string): string {
    return 'All Risks Coverage';
  }

  /**
   * Get list of selected add-ons
   */
  getSelectedAddOns(): string[] {
    const addOns: string[] = [];
    
    if (this.quotationForm.get('concealedLossCover')?.value) {
      addOns.push('Concealed Loss Cover');
    }
    if (this.quotationForm.get('storageWarehouse')?.value) {
      addOns.push('Storage & Warehouse');
    }
    if (this.quotationForm.get('warRisk')?.value) {
      addOns.push('War Risk');
    }
    if (this.quotationForm.get('generalAverage')?.value) {
      addOns.push('General Average');
    }
    if (this.quotationForm.get('territorialExtension')?.value) {
      addOns.push('Territorial Extension');
    }
    if (this.quotationForm.get('dashboardAlerts')?.value) {
      addOns.push('Dashboard Alerts');
    }
    
    return addOns;
  }

  /**
   * Generate payment reference number
   */
  generatePaymentReference(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `MCI-${timestamp}-${random}`;
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Reset all forms and component state
   */
  private resetForms(): void {
    // Reset forms
    this.quotationForm.reset();
    this.paymentForm.reset();
    
    // Reset component state
    this.currentStep = 1;
    this.isLoggedIn = false;
    this.isProcessingPayment = false;
    
    // Reset premium calculation
    this.resetPremiumCalculation();
    
    // Set default values
    this.quotationForm.patchValue({
      tradeType: 'import',
      modeOfShipment: 'sea',
      currency: 'KES',
      coverType: 'ICC_A',
      concealedLossCover: false,
      storageWarehouse: false,
      warRisk: false,
      generalAverage: false,
      territorialExtension: false,
      dashboardAlerts: false,
      termsAndConditions: false,
      dataPrivacyConsent: false
    });
    
    // Set default date
    this.setDefaultDate();
  }

  /**
   * Get product rate percentage for display
   */
  getProductRateDisplay(productType: string): string {
    const rate = this.productRates[productType];
    return rate ? `${(rate * 100).toFixed(2)}%` : '0.20%';
  }
}