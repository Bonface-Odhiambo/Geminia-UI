import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface PremiumCalculation {
  basePremium: number;
  addOnPremium: number;
  netPremium: number;
  premiumLevy: number;  // 0.45% Premium Levy
  phcf: number;         // 0.25% PHCF (Policyholders Compensation Fund)
  stampDuty: number;    // Stamp Duty
  totalPayable: number;
  baseRate: number;
  currency: string;
  // Legacy fields for backward compatibility
  ipl: number;
  trainingLevy: number;
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

  // Current date and time (UTC - YYYY-MM-DD HH:MM:SS formatted)
  private readonly currentDateTime = '2025-07-07 11:28:26';
  private readonly currentUser = 'gerkim62';

  // Tax rates constants for Kenyan insurance regulations
  private readonly TAX_RATES = {
    PREMIUM_LEVY: 0.0045,  // 0.45% Premium Levy
    PHCF: 0.0025,          // 0.25% PHCF (Policyholders Compensation Fund)
    STAMP_DUTY: 40         // KES 40 flat rate for Stamp Duty
  };

  // Single marine product rate for "Marine Cargo Insurance"
  private readonly MARINE_CARGO_RATE = 0.0025; // 0.25% standard rate

  // Product category rates mapping (for productCategory dropdown)
  private productCategoryRates: { [key: string]: number } = {
    canned_foods: 0.0018,          // 0.18%
    electronics: 0.0025,           // 0.25%
    textiles: 0.0020,             // 0.20%
    machinery: 0.0030,            // 0.30%
    food: 0.0018,                 // 0.18%
    pharmaceuticals: 0.0035,      // 0.35%
    automotive: 0.0022,           // 0.22%
    raw_materials: 0.0015,        // 0.15%
    furniture: 0.0025,            // 0.25%
    chemicals: 0.0040,            // 0.40%
    general_merchandise: 0.0020   // 0.20%
  };

  // Default marine product type (no longer a dropdown)
  readonly marineProductType = 'marine_cargo_insurance';
  readonly marineProductDisplayName = 'Marine Cargo Insurance';

  premiumCalculation: PremiumCalculation = {
    basePremium: 0,
    addOnPremium: 0,
    netPremium: 0,
    premiumLevy: 0,
    phcf: 0,
    stampDuty: 0,
    totalPayable: 0,
    baseRate: 0,
    currency: 'KES',
    // Legacy fields for backward compatibility
    ipl: 0,
    trainingLevy: 0,
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
    this.logComponentInitialization();
  }

  /**
   * Log component initialization
   */
  private logComponentInitialization(): void {
    console.log(`[${this.currentDateTime}] Marine Cargo Quotation Component initialized by ${this.currentUser}`);
    console.log(`[${this.currentDateTime}] Updated form structure: Marine Product = ${this.marineProductDisplayName} (default)`);
  }

  /**
   * Close the form and navigate back to homepage
   */
  closeForm(): void {
    console.log(`[${this.currentDateTime}] User ${this.currentUser} closed the form`);
    this.router.navigate(['/']);
  }

  /**
   * Create the quotation form with updated fields
   */
  private createQuotationForm(): FormGroup {
    return this.fb.group({
      // Updated cargo type - containerized or non-containerized
      cargoType: ['', Validators.required],
      
      // Trade type - import and domestic
      tradeType: ['', Validators.required],
      
      // Mode of shipment - sea and land
      modeOfShipment: ['', Validators.required],
      
      // Marine product type - now a hidden field with default value
      productType: [this.marineProductType],
      
      // Category dropdown (kept separate)
      productCategory: ['', Validators.required],
      
      // Location and date fields
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      
      // Date input for shipping date
      shippingDate: ['', [Validators.required, this.dateValidator]],
      
      // Currency and coverage
      currency: ['KES', Validators.required],
      
      // Cover type - only All Risks
      coverType: ['ICC_A', Validators.required],
      
      // Sum insured
      sumInsured: ['', [Validators.required, Validators.min(1)]],
      
      // Description of goods
      descriptionOfGoods: ['', Validators.required],
      
      // IDF number - mandatory for imports
      idfNumber: ['', Validators.required],
      
      // Optional add-ons
      concealedLossCover: [false],
      storageWarehouse: [false],
      warRisk: [false],
      generalAverage: [false],
      territorialExtension: [false],
      
      // Optional dashboard alerts
      dashboardAlerts: [false],
      
      // Terms and conditions agreement
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

    console.log(`[${this.currentDateTime}] Default shipping date set to: ${todayFormatted} by ${this.currentUser}`);
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
      const productCategory = this.quotationForm.get('productCategory')?.value;

      if (sumInsured && sumInsured > 0 && productCategory) {
        this.calculatePremium(sumInsured, currency, productCategory);
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
   * Enhanced premium calculation with marine cargo insurance base rate
   */
  private calculatePremium(sumInsured: number, currency: string, productCategory: string): void {
    // Use the standard marine cargo rate as base
    let baseRate = this.MARINE_CARGO_RATE;
    
    // Apply category-specific adjustment if available
    if (productCategory && this.productCategoryRates[productCategory]) {
      const categoryRate = this.productCategoryRates[productCategory];
      // Use the higher of the two rates for better coverage
      baseRate = Math.max(baseRate, categoryRate);
    }

    // Store original base rate for logging
    const originalRate = baseRate;

    // Adjust rate based on cargo type
    const cargoType = this.quotationForm.get('cargoType')?.value;
    switch (cargoType) {
      case 'non-containerized': 
        baseRate *= 1.2; // 20% increase for non-containerized
        break;
      case 'containerized': 
        baseRate *= 1.0; // Standard rate for containerized
        break;
      default:
        baseRate *= 1.0;
    }

    // Adjust rate based on mode of shipment
    const modeOfShipment = this.quotationForm.get('modeOfShipment')?.value;
    switch (modeOfShipment) {
      case 'land': 
        baseRate *= 1.2; // 20% increase for land transport
        break;
      case 'sea': 
        baseRate *= 1.0; // Standard rate for sea transport
        break;
      default:
        baseRate *= 1.0;
    }

    // Adjust rate based on trade type
    const tradeType = this.quotationForm.get('tradeType')?.value;
    switch (tradeType) {
      case 'domestic': 
        baseRate *= 0.8; // 20% discount for domestic trade
        break;
      case 'import': 
        baseRate *= 1.0; // Standard rate for imports
        break;
      default:
        baseRate *= 1.0;
    }

    // Calculate base premium
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

    // Calculate the required tax components according to Kenyan insurance regulations
    
    // Premium Levy (0.45%)
    const premiumLevy = Math.round(netPremium * this.TAX_RATES.PREMIUM_LEVY * 100) / 100;
    
    // PHCF - Policyholders Compensation Fund (0.25%)
    const phcf = Math.round(netPremium * this.TAX_RATES.PHCF * 100) / 100;
    
    // Stamp Duty (KES 40 flat rate, or equivalent in other currencies)
    let stampDuty = this.TAX_RATES.STAMP_DUTY;
    if (currency !== 'KES') {
      // Convert stamp duty to other currencies (simplified conversion)
      const exchangeRates: { [key: string]: number } = {
        'USD': 0.0077, // 1 KES = 0.0077 USD (approximate)
        'EUR': 0.0070, // 1 KES = 0.0070 EUR (approximate)
        'GBP': 0.0061  // 1 KES = 0.0061 GBP (approximate)
      };
      stampDuty = currency in exchangeRates ? 
        Math.round(stampDuty * exchangeRates[currency] * 100) / 100 : 
        stampDuty;
    }

    // Calculate total payable
    const totalPayable = Math.round((netPremium + premiumLevy + phcf + stampDuty) * 100) / 100;

    // Update premium calculation object
    this.premiumCalculation = {
      basePremium: Math.round(basePremium * 100) / 100,
      addOnPremium: Math.round(addOnPremium * 100) / 100,
      netPremium: Math.round(netPremium * 100) / 100,
      premiumLevy,
      phcf,
      stampDuty,
      totalPayable,
      baseRate,
      currency,
      // Legacy fields for backward compatibility
      ipl: premiumLevy, // Map premium levy to legacy IPL field
      trainingLevy: phcf, // Map PHCF to legacy training levy field
    };

    // Log calculation details
    this.logPremiumCalculation(sumInsured, productCategory, cargoType, modeOfShipment, tradeType, originalRate, baseRate);
  }

  /**
   * Reset premium calculation
   */
  private resetPremiumCalculation(): void {
    this.premiumCalculation = {
      basePremium: 0,
      addOnPremium: 0,
      netPremium: 0,
      premiumLevy: 0,
      phcf: 0,
      stampDuty: 0,
      totalPayable: 0,
      baseRate: 0,
      currency: this.quotationForm.get('currency')?.value || 'KES',
      // Legacy fields
      ipl: 0,
      trainingLevy: 0,
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

    console.log(`[${this.currentDateTime}] Payment method validation updated to: ${method} by ${this.currentUser}`);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.quotationForm.valid) {
      console.log(`[${this.currentDateTime}] Form submitted successfully by ${this.currentUser}`);
      this.goToStep(2);
    } else {
      this.markFormGroupTouched(this.quotationForm);
      console.log(`[${this.currentDateTime}] Form validation failed for user ${this.currentUser}:`, this.getFormValidationErrors());
    }
  }

  /**
   * Proceed to payment step
   */
  proceedToPayment(): void {
    if (this.isLoggedIn) {
      console.log(`[${this.currentDateTime}] User ${this.currentUser} proceeding to payment step`);
      this.goToStep(3);
    } else {
      // Redirect to login page
      console.log(`[${this.currentDateTime}] User ${this.currentUser} redirected to login for payment`);
      this.router.navigate(['/sign-in']);
    }
  }

  /**
   * Simulate login process
   */
  login(): void {
    this.isLoggedIn = true;
    console.log(`[${this.currentDateTime}] User ${this.currentUser} logged in successfully`);
    alert('Login successful! Proceeding to payment.');
    this.goToStep(3);
  }

  /**
   * Process payment
   */
  processPayment(): void {
    if (this.paymentForm.valid) {
      this.isProcessingPayment = true;
      
      console.log(`[${this.currentDateTime}] Payment processing started for user ${this.currentUser}`, {
        paymentMethod: this.paymentForm.get('paymentMethod')?.value,
        amount: this.premiumCalculation.totalPayable,
        currency: this.premiumCalculation.currency
      });
      
      // Simulate payment processing
      setTimeout(() => {
        this.isProcessingPayment = false;
        console.log(`[${this.currentDateTime}] Payment completed successfully for user ${this.currentUser}`);
        alert('Payment successful! Your marine cargo insurance policy has been issued.');
        this.resetForms();
        this.router.navigate(['/dashboard']);
      }, 3000);
    } else {
      this.markFormGroupTouched(this.paymentForm);
      console.log(`[${this.currentDateTime}] Payment form validation failed for user ${this.currentUser}`);
    }
  }

  /**
   * Navigate to specific step
   */
  goToStep(step: number): void {
    const previousStep = this.currentStep;
    this.currentStep = step;
    console.log(`[${this.currentDateTime}] User ${this.currentUser} navigated from step ${previousStep} to step ${step}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Download quote as PDF
   */
  downloadQuote(): void {
    const quoteData = {
      ...this.quotationForm.value,
      premium: this.premiumCalculation,
      premiumBreakdown: {
        sumInsured: this.quotationForm.get('sumInsured')?.value,
        basePremium: this.premiumCalculation.basePremium,
        premiumLevy: this.premiumCalculation.premiumLevy,
        phcf: this.premiumCalculation.phcf,
        stampDuty: this.premiumCalculation.stampDuty,
        netPremium: this.premiumCalculation.netPremium,
        premiumRate: this.premiumCalculation.baseRate,
        totalPayable: this.premiumCalculation.totalPayable
      },
      quoteDate: this.currentDateTime,
      quoteId: this.generatePaymentReference(),
      generatedBy: this.currentUser,
      validUntil: this.getQuoteValidityDate(),
      formVersion: '2.2.0',
      systemInfo: {
        marineProduct: this.marineProductDisplayName,
        cargoTypes: ['Containerized', 'Non-Containerized'],
        categories: Object.keys(this.productCategoryRates)
      }
    };
    
    console.log(`[${this.currentDateTime}] Quote download initiated by ${this.currentUser}:`, quoteData);
    
    // Create and download JSON file
    const dataStr = JSON.stringify(quoteData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `marine-quote-${quoteData.quoteId}-${this.currentDateTime.replace(/[:\s]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Quote download started...');
  }

  /**
   * Save quote to user account
   */
  saveQuote(): void {
    const quoteData = {
      ...this.quotationForm.value,
      premium: this.premiumCalculation,
      premiumBreakdown: {
        sumInsured: this.quotationForm.get('sumInsured')?.value,
        basePremium: this.premiumCalculation.basePremium,
        premiumLevy: this.premiumCalculation.premiumLevy,
        phcf: this.premiumCalculation.phcf,
        stampDuty: this.premiumCalculation.stampDuty,
        netPremium: this.premiumCalculation.netPremium,
        premiumRate: this.premiumCalculation.baseRate,
        totalPayable: this.premiumCalculation.totalPayable
      },
      savedDate: this.currentDateTime,
      quoteId: this.generatePaymentReference(),
      savedBy: this.currentUser,
      status: 'saved'
    };
    
    console.log(`[${this.currentDateTime}] Quote saved by ${this.currentUser}:`, quoteData);
    
    // Save to localStorage as a simulation
    const savedQuotes = JSON.parse(localStorage.getItem('savedMarineQuotes') || '[]');
    savedQuotes.push(quoteData);
    localStorage.setItem('savedMarineQuotes', JSON.stringify(savedQuotes));
    
    alert('Quote saved to your account!');
  }

  /**
   * Get display name for cargo type
   */
  getCargoTypeDisplay(value: string): string {
    const cargoTypes: { [key: string]: string } = {
      containerized: 'Containerized',
      'non-containerized': 'Non-Containerized',
    };
    return cargoTypes[value] || value;
  }

  /**
   * Get display name for marine product type (always returns the default)
   */
  getProductTypeDisplay(value: string): string {
    return this.marineProductDisplayName;
  }

  /**
   * Get display name for product category
   */
  getCategoryDisplay(value: string): string {
    const categories: { [key: string]: string } = {
      canned_foods: 'Canned Foods',
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
    return categories[value] || value;
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
   * Get quote validity date (30 days from now)
   */
  getQuoteValidityDate(): string {
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + 30);
    return validityDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'KES'): string {
    const currencyMap: { [key: string]: string } = {
      'KES': 'en-KE',
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB'
    };

    const locale = currencyMap[currency] || 'en-KE';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
    console.log(`[${this.currentDateTime}] Resetting forms for user ${this.currentUser}`);
    
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
      productType: this.marineProductType, // Set default marine product
      tradeType: '',
      modeOfShipment: '',
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
   * Log premium calculation details
   */
  private logPremiumCalculation(
    sumInsured: number, 
    productCategory: string, 
    cargoType: string, 
    modeOfShipment: string, 
    tradeType: string,
    originalRate: number,
    finalRate: number
  ): void {
    console.log(`[${this.currentDateTime}] Premium calculation by ${this.currentUser}:`, {
      inputs: {
        sumInsured,
        marineProduct: this.marineProductDisplayName,
        productCategory,
        cargoType,
        modeOfShipment,
        tradeType,
        currency: this.premiumCalculation.currency
      },
      rates: {
        standardMarineRate: `${(this.MARINE_CARGO_RATE * 100).toFixed(2)}%`,
        originalBaseRate: `${(originalRate * 100).toFixed(3)}%`,
        finalAdjustedRate: `${(finalRate * 100).toFixed(3)}%`,
        adjustmentFactor: `${((finalRate / originalRate) * 100).toFixed(1)}%`
      },
      breakdown: {
        basePremium: this.premiumCalculation.basePremium,
        addOnPremium: this.premiumCalculation.addOnPremium,
        premiumLevy: this.premiumCalculation.premiumLevy,
        phcf: this.premiumCalculation.phcf,
        stampDuty: this.premiumCalculation.stampDuty,
        netPremium: this.premiumCalculation.netPremium,
        totalPayable: this.premiumCalculation.totalPayable
      },
      adjustments: this.getRateAdjustmentExplanation(),
      taxRates: this.TAX_RATES,
      calculationDateTime: this.currentDateTime
    });
  }

  /**
   * Get adjusted rate explanation for display
   */
  getRateAdjustmentExplanation(): string {
    const cargoType = this.quotationForm.get('cargoType')?.value;
    const modeOfShipment = this.quotationForm.get('modeOfShipment')?.value;
    const tradeType = this.quotationForm.get('tradeType')?.value;
    
    let adjustments: string[] = [];
    
    if (cargoType === 'non-containerized') {
      adjustments.push('Non-Containerized: +20%');
    }
    if (modeOfShipment === 'land') {
      adjustments.push('Land Transport: +20%');
    }
    if (tradeType === 'domestic') {
      adjustments.push('Domestic Trade: -20%');
    }
    
    return adjustments.length > 0 ? adjustments.join(', ') : 'No adjustments applied';
  }

  /**
   * Get form validation errors
   */
  private getFormValidationErrors(): any {
    const formErrors: any = {};
    Object.keys(this.quotationForm.controls).forEach(key => {
      const controlErrors = this.quotationForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }

  /**
   * Get marine product rate for display
   */
  getMarineProductRate(): string {
    return `${(this.MARINE_CARGO_RATE * 100).toFixed(2)}%`;
  }

  /**
   * Get category rate for display
   */
  getCategoryRate(category: string): string {
    const rate = this.productCategoryRates[category];
    return rate ? `${(rate * 100).toFixed(2)}%` : 'N/A';
  }

  /**
   * Export complete system data for debugging
   */
  exportSystemData(): any {
    return {
      timestamp: this.currentDateTime,
      user: this.currentUser,
      componentVersion: '2.2.0',
      formData: this.quotationForm.value,
      premiumCalculation: this.premiumCalculation,
      taxRates: this.TAX_RATES,
      marineProductRate: this.MARINE_CARGO_RATE,
      marineProductType: this.marineProductType,
      marineProductDisplayName: this.marineProductDisplayName,
      categoryRates: this.productCategoryRates,
      systemConfiguration: {
        marineProduct: this.marineProductDisplayName,
        cargoTypes: ['containerized', 'non-containerized'],
        tradeTypes: ['import', 'domestic'],
        modeOfShipment: ['sea', 'land'],
        currencies: ['KES', 'USD', 'EUR', 'GBP']
      },
      adjustmentFactors: {
        nonContainerized: 1.2,
        landTransport: 1.2,
        domesticDiscount: 0.8
      }
    };
  }

  /**
   * Validate IDF number format
   */
  private validateIdfNumber(idfNumber: string): boolean {
    // Basic IDF number validation - should start with IDF and have at least 10 characters
    const idfRegex = /^IDF[A-Z0-9]{7,}$/i;
    return idfRegex.test(idfNumber);
  }

  /**
   * Calculate estimated delivery date based on mode of shipment
   */
  getEstimatedDeliveryDate(): string {
    const shippingDate = this.quotationForm.get('shippingDate')?.value;
    const modeOfShipment = this.quotationForm.get('modeOfShipment')?.value;
    
    if (!shippingDate) return 'N/A';
    
    const deliveryDays = modeOfShipment === 'sea' ? 30 : 14; // Sea: 30 days, Land: 14 days
    
    const [day, month, year] = shippingDate.split('/').map(Number);
    const shipDate = new Date(year, month - 1, day);
    const deliveryDate = new Date(shipDate);
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    return deliveryDate.toLocaleDateString('en-GB');
  }

  /**
   * Get risk assessment based on selections
   */
  getRiskAssessment(): string {
    const productCategory = this.quotationForm.get('productCategory')?.value;
    const cargoType = this.quotationForm.get('cargoType')?.value;
    const modeOfShipment = this.quotationForm.get('modeOfShipment')?.value;
    
    let riskLevel = 'Low';
    
    if (productCategory === 'chemicals' || productCategory === 'pharmaceuticals') {
      riskLevel = 'Medium-High';
    } else if (productCategory === 'machinery' || productCategory === 'electronics') {
      riskLevel = 'Medium';
    } else if (cargoType === 'non-containerized' || modeOfShipment === 'land') {
      riskLevel = 'Medium';
    }
    
    return riskLevel;
  }
}