import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- ENUMS ---
export enum PlanType {
  PLAN_A = 'Plan A',
  PLAN_B = 'Plan B',
  PLAN_C = 'Plan C',
}

export enum QuoteStep {
  PLAN_SELECTION = 1,
  TRAVELER_DETAILS = 2,
  PAYMENT = 3,
}

// --- INTERFACES ---
export interface TravelerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportNumber: string;
  placeOfOrigin: string;
  destination: string;
  travelPurpose: string;
  departureDate: string;
  returnDate: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Agreements {
  dataPrivacy: boolean;
  termsAndConditions: boolean;
}

export interface Traveler {
  name: string;
  dob: string;
  passport: string;
  nationality: string;
  nationalitySearch?: string;
  email?: string;
  phone?: string;
}

export interface EmergencyContact {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

// New interface for premium summary
export interface PremiumSummary {
  sumInsured: number;
  basePremium: number;
  premiumLevy: number;
  phcf: number;
  stampDuty: number;
  netPremium: number;
  premiumRate: number;
}

export interface QuoteData {
  id: string;
  planType: PlanType;
  departureCountry: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  travelers: {
    between18and65: number;
    under18: number;
    over65: number;
  };
  totalTravelers: number;
  premium: number;
  premiumSummary: PremiumSummary;
  travelerDetails: Traveler[];
  emergencyContact: EmergencyContact;
  createdAt: Date;
  expiresAt: Date;
}

export interface ProductCard {
  name: PlanType;
  description: string;
  benefits: string[];
  startingPrice: number;
  popular?: boolean;
  color: string;
  sumInsured: number; // Add sum insured to product cards
}

export interface ValidationErrors {
  [key: string]: string[];
}

@Component({
  selector: 'app-travel-quote',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel-quote.component.html',
  styleUrls: ['./travel-quote.component.scss'],
})
export class TravelQuoteComponent implements OnInit {
  // --- ENUMS FOR TEMPLATE ---
  readonly PlanType = PlanType;
  readonly QuoteStep = QuoteStep;

  // --- TAX RATES CONSTANTS ---
  private readonly TAX_RATES = {
    PREMIUM_LEVY: 0.0025, // 0.25%
    PHCF: 0.0025, // 0.25%
    STAMP_DUTY: 40 // KSh 40 flat rate
  };

  // --- STATE MANAGEMENT ---
  state = {
    currentStep: QuoteStep.PLAN_SELECTION,
    isLoading: false,
    hasErrors: false,
  };

  selectedPlan: string | null = null;

  // --- TRAVELER DETAILS ---
  travelerDetails: TravelerDetails = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    passportNumber: '',
    placeOfOrigin: '',
    destination: '',
    travelPurpose: '',
    departureDate: '',
    returnDate: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  };

  // --- AGREEMENTS ---
  agreements: Agreements = {
    dataPrivacy: false,
    termsAndConditions: false
  };

  // --- VALIDATION ---
  validationErrors: ValidationErrors = {};

  // --- SEARCHABLE DROPDOWN PROPERTIES ---
  originSearch: string = '';
  destinationSearch: string = '';
  showOriginDropdown: boolean = false;
  showDestinationDropdown: boolean = false;
  filteredOriginCountries: string[] = [];
  filteredDestinationCountries: string[] = [];

  // --- DATA ---
  productCards: ProductCard[] = [
    {
      name: PlanType.PLAN_A,
      description: 'Essential coverage for budget-conscious travelers',
      benefits: [
        'Medical Emergency Coverage up to $50,000',
        'Trip Cancellation Protection up to $5,000',
        'Baggage Loss Coverage up to $1,000',
        '24/7 Emergency Assistance',
        'Personal Liability up to $100,000',
      ],
      startingPrice: 18.00,
      sumInsured: 50000,
      color: 'blue',
    },
    {
      name: PlanType.PLAN_B,
      description: 'Comprehensive protection for most travelers',
      benefits: [
        'Medical Emergency Coverage up to $100,000',
        'Trip Cancellation Protection up to $10,000',
        'Baggage Loss Coverage up to $2,500',
        '24/7 Emergency Assistance',
        'Personal Liability up to $250,000',
        'Trip Interruption Coverage',
        'Emergency Evacuation',
        'Rental Car Coverage',
      ],
      startingPrice: 25.00,
      sumInsured: 100000,
      popular: true,
      color: 'purple',
    },
    {
      name: PlanType.PLAN_C,
      description: 'Premium coverage with maximum protection',
      benefits: [
        'Medical Emergency Coverage up to $250,000',
        'Trip Cancellation Protection up to $25,000',
        'Baggage Loss Coverage up to $5,000',
        '24/7 Emergency Assistance',
        'Personal Liability up to $500,000',
        'Trip Interruption Coverage',
        'Emergency Evacuation',
        'Rental Car Coverage',
        'Adventure Sports Coverage',
        'Pre-existing Medical Conditions',
        'Cancel for Any Reason',
        'Concierge Services',
      ],
      startingPrice: 35.00,
      sumInsured: 250000,
      color: 'amber',
    },
  ];

  stepLabels = ['Select Plan', 'Traveler Details', 'Payment'];

  countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
    'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
    'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
    'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
    'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China',
    'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',
    'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
    'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
    'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
    'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
    'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Korea North', 'Korea South', 'Kosovo',
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
    'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
    'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
    'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
    'Niger', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palau',
    'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
    'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
    'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
    'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
    'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
    'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
    'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago',
    'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
    'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
    'Zambia', 'Zimbabwe',
  ];

  relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];

  quote!: QuoteData;

  ngOnInit(): void {
    this.filteredOriginCountries = [...this.countries];
    this.filteredDestinationCountries = [...this.countries];
  }

  // --- PLAN SELECTION ---
  selectPlan(planType: string): void {
    this.selectedPlan = planType;
    this.initializeQuote(planType as PlanType);
  }

  private initializeQuote(planType: PlanType): void {
    const quoteId = this.generateQuoteId();
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    this.quote = {
      id: quoteId,
      planType,
      departureCountry: 'Kenya',
      destinationCountry: '',
      startDate: this.getDefaultStartDate(),
      endDate: '',
      travelers: { between18and65: 1, under18: 0, over65: 0 },
      totalTravelers: 1,
      premium: 0,
      premiumSummary: {
        sumInsured: 0,
        basePremium: 0,
        premiumLevy: 0,
        phcf: 0,
        stampDuty: 0,
        netPremium: 0,
        premiumRate: 0
      },
      travelerDetails: [],
      emergencyContact: { name: '', email: '', phone: '', relationship: '' },
      createdAt: now,
      expiresAt: expiryDate,
    };

    this.onTravelerCountChange();
  }

  // --- SEARCHABLE DROPDOWN METHODS ---
  filterOriginCountries(event: any): void {
    const query = event.target.value.toLowerCase();
    this.originSearch = event.target.value;
    this.travelerDetails.placeOfOrigin = event.target.value;
    this.filteredOriginCountries = this.countries.filter((country) =>
      country.toLowerCase().includes(query),
    );
    this.showOriginDropdown = true;
  }

  selectOriginCountry(country: string): void {
    this.travelerDetails.placeOfOrigin = country;
    this.originSearch = country;
    this.showOriginDropdown = false;
  }

  filterDestinationCountries(event: any): void {
    const query = event.target.value.toLowerCase();
    this.destinationSearch = event.target.value;
    this.travelerDetails.destination = event.target.value;
    this.filteredDestinationCountries = this.countries.filter((country) =>
      country.toLowerCase().includes(query),
    );
    this.showDestinationDropdown = true;
  }

  selectDestinationCountry(country: string): void {
    this.travelerDetails.destination = country;
    this.destinationSearch = country;
    this.showDestinationDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.origin-dropdown-container')) {
      this.showOriginDropdown = false;
    }
    if (!target.closest('.destination-dropdown-container')) {
      this.showDestinationDropdown = false;
    }
  }

  // --- STEP NAVIGATION ---
  goToStep(step: QuoteStep): void {
    if (step > this.state.currentStep) {
      if (!this.validateCurrentStep()) {
        return;
      }
    }
    this.state.currentStep = step;
    this.clearValidationErrors();
  }

  goToNextStep(): void {
    if (this.state.currentStep === QuoteStep.PLAN_SELECTION) {
      if (this.validatePlanSelection()) {
        this.state.currentStep = QuoteStep.TRAVELER_DETAILS;
        this.clearValidationErrors();
      }
    } else if (this.state.currentStep === QuoteStep.TRAVELER_DETAILS) {
      if (this.validateTravelerDetails()) {
        this.state.currentStep = QuoteStep.PAYMENT;
        this.clearValidationErrors();
      }
    }
  }

  goToPreviousStep(): void {
    if (this.state.currentStep === QuoteStep.PAYMENT) {
      this.state.currentStep = QuoteStep.TRAVELER_DETAILS;
    } else if (this.state.currentStep === QuoteStep.TRAVELER_DETAILS) {
      this.state.currentStep = QuoteStep.PLAN_SELECTION;
    }
    this.clearValidationErrors();
  }

  returnToHomepage(): void {
    window.location.href = '/';
  }

  // --- CALCULATIONS ---
  calculatePremium(): void {
    if (!this.quote) return;

    const { between18and65, under18, over65 } = this.quote.travelers;
    const rates = this.getPricingRates();

    const basePremium =
      between18and65 * rates.adult +
      under18 * rates.child +
      over65 * rates.senior;

    this.quote.premium = Math.round(basePremium * 100) / 100;
    
    // Calculate premium summary with taxes
    this.calculatePremiumSummary(basePremium);
  }

  private calculatePremiumSummary(basePremium: number): void {
    if (!this.quote) return;

    const selectedProduct = this.productCards.find(card => card.name === this.quote.planType);
    const sumInsured = selectedProduct ? selectedProduct.sumInsured : 0;

    // Calculate taxes
    const premiumLevy = Math.round(basePremium * this.TAX_RATES.PREMIUM_LEVY * 100) / 100;
    const phcf = Math.round(basePremium * this.TAX_RATES.PHCF * 100) / 100;
    const stampDuty = this.TAX_RATES.STAMP_DUTY;
    const netPremium = Math.round((basePremium + premiumLevy + phcf + stampDuty) * 100) / 100;
    const premiumRate = sumInsured > 0 ? Math.round((netPremium / sumInsured) * 10000 * 100) / 100 : 0; // Rate per 10,000 coverage

    this.quote.premiumSummary = {
      sumInsured,
      basePremium: Math.round(basePremium * 100) / 100,
      premiumLevy,
      phcf,
      stampDuty,
      netPremium,
      premiumRate
    };
  }

  getPriceForAge(ageGroup: 'adult' | 'child' | 'senior'): number {
    const rates = this.getPricingRates();
    return rates[ageGroup];
  }

  private getPricingRates() {
    const baseRates = { adult: 18.00, child: 12.0, senior: 30.0 };

    if (!this.selectedPlan) return baseRates;

    let multiplier = 1.0;
    if (this.selectedPlan === 'Plan B') multiplier = 1.39;
    if (this.selectedPlan === 'Plan C') multiplier = 1.94;

    return {
      adult: Math.round(baseRates.adult * multiplier * 100) / 100,
      child: Math.round(baseRates.child * multiplier * 100) / 100,
      senior: Math.round(baseRates.senior * multiplier * 100) / 100,
    };
  }

  // --- FORMATTING METHODS ---
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // --- VALIDATION ---
  validateCurrentStep(): boolean {
    this.clearValidationErrors();

    switch (this.state.currentStep) {
      case QuoteStep.PLAN_SELECTION:
        return this.validatePlanSelection();
      case QuoteStep.TRAVELER_DETAILS:
        return this.validateTravelerDetails();
      case QuoteStep.PAYMENT:
        return true;
      default:
        return true;
    }
  }

  private validatePlanSelection(): boolean {
    const errors: string[] = [];
    if (!this.selectedPlan) {
      errors.push('Please select a travel plan');
    }
    if (errors.length > 0) {
      this.validationErrors['plan'] = errors;
      this.state.hasErrors = true;
      return false;
    }
    return true;
  }

  private validateTravelerDetails(): boolean {
    const errors: string[] = [];

    // Personal Information validation
    if (!this.travelerDetails.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!this.travelerDetails.lastName?.trim()) {
      errors.push('Last name is required');
    }
    if (!this.travelerDetails.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.travelerDetails.email)) {
      errors.push('Email is invalid');
    }
    if (!this.travelerDetails.phone?.trim()) {
      errors.push('Phone number is required');
    }
    if (!this.travelerDetails.dateOfBirth) {
      errors.push('Date of birth is required');
    }
    if (!this.travelerDetails.passportNumber?.trim()) {
      errors.push('Passport number is required');
    }

    // Travel Information validation
    if (!this.travelerDetails.placeOfOrigin?.trim()) {
      errors.push('Place of origin is required');
    }
    if (!this.travelerDetails.destination?.trim()) {
      errors.push('Destination country is required');
    }
    if (!this.travelerDetails.travelPurpose) {
      errors.push('Purpose of travel is required');
    }
    if (!this.travelerDetails.departureDate) {
      errors.push('Departure date is required');
    }
    if (!this.travelerDetails.returnDate) {
      errors.push('Return date is required');
    }
    if (this.travelerDetails.departureDate && this.travelerDetails.returnDate) {
      if (new Date(this.travelerDetails.departureDate) >= new Date(this.travelerDetails.returnDate)) {
        errors.push('Return date must be after departure date');
      }
    }

    // Emergency Contact validation
    if (!this.travelerDetails.emergencyContact.name?.trim()) {
      errors.push('Emergency contact name is required');
    }
    if (!this.travelerDetails.emergencyContact.phone?.trim()) {
      errors.push('Emergency contact phone is required');
    }
    if (!this.travelerDetails.emergencyContact.relationship) {
      errors.push('Emergency contact relationship is required');
    }

    // Agreements validation
    if (!this.agreements.dataPrivacy) {
      errors.push('You must agree to the Data Privacy Policy');
    }
    if (!this.agreements.termsAndConditions) {
      errors.push('You must agree to the Terms and Conditions');
    }

    if (errors.length > 0) {
      this.validationErrors['details'] = errors;
      this.state.hasErrors = true;
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private clearValidationErrors(): void {
    this.validationErrors = {};
    this.state.hasErrors = false;
  }

  // --- UTILITY METHODS ---
  private generateQuoteId(): string {
    return (
      'GEM-' +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substr(2, 5).toUpperCase()
    );
  }

  getDefaultStartDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private initializeTravelerDetails(): void {
    const currentDetailsCount = this.quote.travelerDetails.length;
    if (this.quote.totalTravelers > currentDetailsCount) {
      for (let i = currentDetailsCount; i < this.quote.totalTravelers; i++) {
        this.quote.travelerDetails.push({
          name: '',
          dob: '',
          passport: '',
          nationality: this.quote.departureCountry,
          nationalitySearch: this.quote.departureCountry,
        });
      }
    } else if (this.quote.totalTravelers < currentDetailsCount) {
      this.quote.travelerDetails.length = this.quote.totalTravelers;
    }
  }

  // --- EVENT HANDLERS ---
  onTravelerCountChange(): void {
    this.quote.totalTravelers =
      this.quote.travelers.between18and65 +
      this.quote.travelers.under18 +
      this.quote.travelers.over65;
    this.calculatePremium();
    this.initializeTravelerDetails();
  }

  onDateChange(): void {
    this.calculatePremium();
  }

  // --- METHODS CALLED FROM HTML ---
  downloadQuote(): void {
    const quoteData = {
      quoteId: this.quote?.id || 'N/A',
      planType: this.selectedPlan,
      travelerDetails: this.travelerDetails,
      premiumSummary: this.quote?.premiumSummary,
      agreements: this.agreements,
      createdAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(quoteData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `travel-quote-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  proceedToPayment(): void {
    if (!this.isFormValid()) {
      console.log('Form is not valid');
      return;
    }

    console.log('Processing payment for traveler:', this.travelerDetails);
    console.log('Premium summary:', this.quote.premiumSummary);
    console.log('Agreements:', this.agreements);
    
    // Redirect to sign-in page
    window.location.href = '/sign-in';
  }

  // --- GETTERS ---
  get isStepValid(): boolean {
    return Object.keys(this.validationErrors).length === 0;
  }

  get canProceedToNext(): boolean {
    return this.isStepValid && !this.state.isLoading;
  }

  get quoteSummary(): string {
    if (!this.selectedPlan) return '';
    return `${this.selectedPlan} for traveler`;
  }

  // Method called from HTML template - updated for proper validation including agreements
  isFormValid(): boolean {
    // Check if all required fields are filled
    return !!(
      this.travelerDetails.firstName?.trim() &&
      this.travelerDetails.lastName?.trim() &&
      this.travelerDetails.email?.trim() &&
      this.travelerDetails.phone?.trim() &&
      this.travelerDetails.dateOfBirth &&
      this.travelerDetails.passportNumber?.trim() &&
      this.travelerDetails.placeOfOrigin?.trim() &&
      this.travelerDetails.destination?.trim() &&
      this.travelerDetails.travelPurpose &&
      this.travelerDetails.departureDate &&
      this.travelerDetails.returnDate &&
      this.travelerDetails.emergencyContact.name?.trim() &&
      this.travelerDetails.emergencyContact.phone?.trim() &&
      this.travelerDetails.emergencyContact.relationship &&
      this.agreements.dataPrivacy &&
      this.agreements.termsAndConditions &&
      this.isValidEmail(this.travelerDetails.email) &&
      new Date(this.travelerDetails.departureDate) < new Date(this.travelerDetails.returnDate)
    );
  }

  get Math() {
    return Math;
  }
}