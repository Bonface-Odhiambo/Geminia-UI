import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- ENUMS ---
export enum PlanType {
  PLAN_A = 'Plan A - Essential',
  PLAN_B = 'Plan B - Comprehensive',
  PLAN_C = 'Plan C - Premium',
}

export enum QuoteStep {
  PLAN_SELECTION = 1,
  TRAVEL_DETAILS = 2,
  // SUMMARY = 3, // Removed as per request
  PAYMENT = 3, // Now the 3rd step
}

// --- INTERFACES ---
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

  // --- STATE MANAGEMENT ---
  state = {
    currentStep: QuoteStep.PLAN_SELECTION,
    isLoading: false,
    hasErrors: false,
  };

  selectedPlan: PlanType | null = null;
  // summaryConfirmed: boolean = false; // Removed

  // --- VALIDATION ---
  validationErrors: ValidationErrors = {};

  // --- SEARCHABLE DROPDOWN PROPERTIES ---
  departureCountrySearch: string = '';
  destinationCountrySearch: string = '';
  showDepartureDropdown: boolean = false;
  showDestinationDropdown: boolean = false;
  showNationalityDropdown: boolean[] = [];
  filteredNationalities: string[][] = [];
  filteredDepartureCountries: string[] = [];
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
      startingPrice: 25.99,
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
      startingPrice: 45.99,
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
      startingPrice: 75.99,
      color: 'amber',
    },
  ];

  // Updated step labels
  stepLabels = ['Select Plan', 'Travel Details', 'Payment']; // Now 3 steps

  countries = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'Andorra',
    'Angola',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'Brunei',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Cape Verde',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo',
    'Costa Rica',
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'East Timor',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Greece',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Korea North',
    'Korea South',
    'Kosovo',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Macedonia',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Swaziland',
    'Sweden',
    'Switzerland',
    'Syria',
    'Taiwan',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Vatican City',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Zambia',
    'Zimbabwe',
  ];

  relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];

  quote!: QuoteData;

  ngOnInit(): void {
    this.filteredDepartureCountries = [...this.countries];
    this.filteredDestinationCountries = [...this.countries];
    this.departureCountrySearch = 'Kenya';
    this.destinationCountrySearch = '';
  }

  // --- PLAN SELECTION ---
  selectPlan(planType: PlanType): void {
    this.selectedPlan = planType;
    this.initializeQuote(planType);
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
      travelerDetails: [],
      emergencyContact: { name: '', email: '', phone: '', relationship: '' },
      createdAt: now,
      expiresAt: expiryDate,
    };

    this.departureCountrySearch = this.quote.departureCountry;
    this.destinationCountrySearch = '';
    this.showNationalityDropdown = [];
    this.filteredNationalities = [];

    this.onTravelerCountChange();
  }

  // --- SEARCHABLE DROPDOWN METHODS ---
  filterDepartureCountries(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredDepartureCountries = this.countries.filter((country) =>
      country.toLowerCase().includes(query),
    );
    this.showDepartureDropdown = true;
  }

  filterDestinationCountries(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredDestinationCountries = this.countries.filter((country) =>
      country.toLowerCase().includes(query),
    );
    this.showDestinationDropdown = true;
  }

  selectDepartureCountry(country: string): void {
    this.quote.departureCountry = country;
    this.departureCountrySearch = country;
    this.showDepartureDropdown = false;
  }

  selectDestinationCountry(country: string): void {
    this.quote.destinationCountry = country;
    this.destinationCountrySearch = country;
    this.showDestinationDropdown = false;
    this.calculatePremium();
  }

  filterNationalities(event: any, index: number): void {
    const query = event.target.value.toLowerCase();
    if (!this.filteredNationalities[index]) {
      this.filteredNationalities[index] = [];
    }
    this.filteredNationalities[index] = this.countries.filter((country) =>
      country.toLowerCase().includes(query),
    );
    this.showNationalityDropdown[index] = true;
  }

  selectNationality(nationality: string, index: number): void {
    this.quote.travelerDetails[index].nationality = nationality;
    this.quote.travelerDetails[index].nationalitySearch = nationality;
    this.showNationalityDropdown[index] = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showDepartureDropdown = false;
      this.showDestinationDropdown = false;
      this.showNationalityDropdown.fill(false);
    }
  }

  // --- STEP NAVIGATION ---
  goToStep(step: QuoteStep): void {
    // Only validate if moving forward or specifically to a step where validation is needed
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
        this.state.currentStep = QuoteStep.TRAVEL_DETAILS;
        this.clearValidationErrors();
      }
    } else if (this.state.currentStep === QuoteStep.TRAVEL_DETAILS) {
      if (this.validateTravelerDetails()) {
        this.state.currentStep = QuoteStep.PAYMENT; // Direct to payment
        this.clearValidationErrors();
      }
    }
    // No other next steps from PAYMENT
  }

  goToPreviousStep(): void {
    if (this.state.currentStep === QuoteStep.PAYMENT) {
      this.state.currentStep = QuoteStep.TRAVEL_DETAILS;
    } else if (this.state.currentStep === QuoteStep.TRAVEL_DETAILS) {
      this.state.currentStep = QuoteStep.PLAN_SELECTION;
    }
    this.clearValidationErrors(); // Clear errors when going back
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
  }

  getPriceForAge(ageGroup: 'adult' | 'child' | 'senior'): number {
    const rates = this.getPricingRates();
    return rates[ageGroup];
  }

  private getPricingRates() {
    const baseRates = { adult: 25.99, child: 18.0, senior: 45.0 };

    if (!this.selectedPlan) return baseRates;

    // Apply multipliers based on plan type
    let multiplier = 1.0;
    if (this.selectedPlan === PlanType.PLAN_B) multiplier = 1.77;
    if (this.selectedPlan === PlanType.PLAN_C) multiplier = 2.92;

    return {
      adult: Math.round(baseRates.adult * multiplier * 100) / 100,
      child: Math.round(baseRates.child * multiplier * 100) / 100,
      senior: Math.round(baseRates.senior * multiplier * 100) / 100,
    };
  }

  // --- VALIDATION ---
  validateCurrentStep(): boolean {
    this.clearValidationErrors(); // Clear previous errors before validating

    switch (this.state.currentStep) {
      case QuoteStep.PLAN_SELECTION:
        return this.validatePlanSelection();
      case QuoteStep.TRAVEL_DETAILS:
        return this.validateTravelerDetails();
      case QuoteStep.PAYMENT:
        // No explicit validation needed for the payment view itself
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

    // Trip details validation
    if (!this.quote.destinationCountry) {
      errors.push('Destination country is required');
    }
    if (!this.quote.startDate) {
      errors.push('Departure Date is required');
    }
    if (!this.quote.endDate) {
      errors.push('Return Date is required');
    }
    if (this.quote.startDate && this.quote.endDate) {
      if (new Date(this.quote.startDate) >= new Date(this.quote.endDate)) {
        errors.push('Return Date must be after Departure Date');
      }
    }
    if (this.quote.totalTravelers === 0) {
      errors.push('At least one traveler is required');
    }

    // Traveler details validation
    this.quote.travelerDetails.forEach((traveler, index) => {
      if (!traveler.name || !traveler.name.trim()) {
        errors.push(`Traveler ${index + 1}: Name is required`);
      }
      if (!traveler.dob) {
        errors.push(`Traveler ${index + 1}: Date of birth is required`);
      }
      if (!traveler.passport || !traveler.passport.trim()) {
        errors.push(`Traveler ${index + 1}: Passport number is required`);
      }
      if (!traveler.nationality) {
        errors.push(`Traveler ${index + 1}: Nationality is required`);
      }
    });

    // Emergency contact validation
    if (!this.quote.emergencyContact.name || !this.quote.emergencyContact.name.trim()) {
      errors.push('Emergency contact name is required');
    }
    if (!this.quote.emergencyContact.relationship) {
      errors.push('Emergency contact relationship is required');
    }
    if (!this.quote.emergencyContact.email || !this.quote.emergencyContact.email.trim()) {
      errors.push('Emergency contact email is required');
    } else if (!this.isValidEmail(this.quote.emergencyContact.email)) {
      errors.push('Emergency contact email is invalid');
    }
    if (!this.quote.emergencyContact.phone || !this.quote.emergencyContact.phone.trim()) {
      errors.push('Emergency contact phone is required');
    }

    if (errors.length > 0) {
      this.validationErrors['details'] = errors;
      this.state.hasErrors = true;
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    // Simple email regex for basic validation
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

    this.showNationalityDropdown = new Array(this.quote.totalTravelers).fill(
      false,
    );
    this.filteredNationalities = new Array(this.quote.totalTravelers)
      .fill(null)
      .map(() => [...this.countries]);
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

  downloadQuote(): void {
    const quoteData = {
      quoteId: this.quote.id,
      planType: this.selectedPlan,
      premium: this.quote.premium,
      travelers: this.quote.totalTravelers,
      destination: this.quote.destinationCountry,
      dates: `${this.quote.startDate} to ${this.quote.endDate}`,
      createdAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(quoteData, null, 2);
    // Correctly define dataUri here
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `travel-quote-${this.quote.id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  proceedToPayment(): void {
    // This button now directly calls processPayment, as validation is done by goToNextStep
    this.processPayment();
  }

  processPayment(): void {
    console.log('Processing payment for quote:', this.quote);
    // In a real app, you would integrate with a payment gateway here.
    // For this example, we'll simulate a redirect.
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
    if (!this.quote || !this.selectedPlan) return '';
    return `${this.selectedPlan} for ${this.quote.totalTravelers} traveler(s)`;
  }

  get Math() {
    return Math;
  }
}