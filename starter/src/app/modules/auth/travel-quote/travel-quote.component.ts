import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- ENUMS ---
export enum PlanType {
  RETAIL_TRAVEL = 'Retail Travel',
  STUDENT_COVER = 'Student Cover',
  PILGRIMAGE = 'Pilgrimage',
}

export enum QuoteStep {
  PLAN_SELECTION = 1,
  TRAVEL_DETAILS = 2,
  SUMMARY = 3,
  PAYMENT = 4,
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
  icon: string;
  description: string;
  features: string[];
  startingPrice: number;
  popular?: boolean;
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
  summaryConfirmed: boolean = false;

  // --- VALIDATION ---
  validationErrors: ValidationErrors = {};

  // --- SEARCHABLE DROPDOWN PROPERTIES ---
  departureCountrySearch: string = '';
  destinationCountrySearch: string = '';
  showDepartureDropdown: boolean = false;
  showDestinationDropdown: boolean = false;
  filteredDepartureCountries: string[] = [];
  filteredDestinationCountries: string[] = [];
  showNationalityDropdown: boolean[] = [];
  filteredNationalities: string[][] = [];

  // --- DATA ---
  productCards: ProductCard[] = [
    {
      name: PlanType.RETAIL_TRAVEL,
      icon: '✈️',
      description: 'Comprehensive coverage for leisure and business travel worldwide',
      features: [
        'Medical Emergency Coverage',
        'Trip Cancellation Protection',
        'Baggage Loss Coverage',
        '24/7 Emergency Assistance'
      ],
      startingPrice: 35.93,
      popular: true,
    },
    {
      name: PlanType.STUDENT_COVER,
      icon: '🎓',
      description: 'Specialized coverage designed for students studying abroad',
      features: [
        'Study Interruption Coverage',
        'Medical & Dental Care',
        'Personal Liability',
        'Academic Equipment Protection'
      ],
      startingPrice: 28.74,
    },
    {
      name: PlanType.PILGRIMAGE,
      icon: '🕌',
      description: 'Tailored coverage for religious pilgrimages and spiritual journeys',
      features: [
        'Religious Site Coverage',
        'Group Travel Benefits',
        'Extended Medical Care',
        'Spiritual Journey Protection'
      ],
      startingPrice: 43.12,
    },
  ];

  stepLabels = ['Select Plan', 'Travel Details', 'Summary', 'Payment'];

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
      country.toLowerCase().includes(query)
    );
    this.showDepartureDropdown = true;
  }

  filterDestinationCountries(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredDestinationCountries = this.countries.filter((country) =>
      country.toLowerCase().includes(query)
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
      country.toLowerCase().includes(query)
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
    if (!this.validateCurrentStep()) {
      return;
    }
    this.state.currentStep = step;
    this.clearValidationErrors();
  }

  goToNextStep(): void {
    const nextStep = this.state.currentStep + 1;
    if (nextStep <= QuoteStep.PAYMENT) {
      this.goToStep(nextStep as QuoteStep);
    }
  }

  goToPreviousStep(): void {
    const previousStep = this.state.currentStep - 1;
    if (previousStep >= QuoteStep.PLAN_SELECTION) {
      this.goToStep(previousStep as QuoteStep);
    }
  }

  resetToStart(): void {
    this.state.currentStep = QuoteStep.PLAN_SELECTION;
    this.selectedPlan = null;
    this.clearValidationErrors();
    this.departureCountrySearch = 'Kenya';
    this.destinationCountrySearch = '';
    this.summaryConfirmed = false;
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
    const baseRates = { adult: 35.93, child: 25.0, senior: 65.0 };
    
    if (!this.selectedPlan) return baseRates;

    // Apply multipliers based on plan type
    let multiplier = 1.0;
    if (this.selectedPlan === PlanType.STUDENT_COVER) multiplier = 0.8;
    if (this.selectedPlan === PlanType.PILGRIMAGE) multiplier = 1.2;

    return {
      adult: Math.round(baseRates.adult * multiplier * 100) / 100,
      child: Math.round(baseRates.child * multiplier * 100) / 100,
      senior: Math.round(baseRates.senior * multiplier * 100) / 100,
    };
  }

  // --- VALIDATION ---
  validateCurrentStep(): boolean {
    this.clearValidationErrors();
    
    switch (this.state.currentStep) {
      case QuoteStep.PLAN_SELECTION:
        return this.validatePlanSelection();
      case QuoteStep.TRAVEL_DETAILS:
        return this.validateTravelerDetails();
      case QuoteStep.SUMMARY:
        return this.validateSummary();
      default:
        return true;
    }
  }

  private validatePlanSelection(): boolean {
    if (!this.selectedPlan) {
      this.validationErrors['plan'] = ['Please select a travel plan'];
      return false;
    }
    return true;
  }

  private validateTravelerDetails(): boolean {
    const errors: string[] = [];
    
    // Trip details validation
    if (!this.quote.destinationCountry)
      errors.push('Destination country is required');
    if (!this.quote.startDate) errors.push('Start date is required');
    if (!this.quote.endDate) errors.push('End date is required');
    if (new Date(this.quote.startDate) >= new Date(this.quote.endDate))
      errors.push('End date must be after start date');
    if (this.quote.totalTravelers === 0)
      errors.push('At least one traveler is required');

    // Traveler details validation
    this.quote.travelerDetails.forEach((traveler, index) => {
      if (!traveler.name.trim())
        errors.push(`Traveler ${index + 1}: Name is required`);
      if (!traveler.dob)
        errors.push(`Traveler ${index + 1}: Date of birth is required`);
      if (!traveler.passport.trim())
        errors.push(`Traveler ${index + 1}: Passport number is required`);
      if (!traveler.nationality)
        errors.push(`Traveler ${index + 1}: Nationality is required`);
    });

    // Emergency contact validation
    if (!this.quote.emergencyContact.name.trim())
      errors.push('Emergency contact name is required');
    if (!this.quote.emergencyContact.relationship)
      errors.push('Emergency contact relationship is required');
    if (!this.quote.emergencyContact.email.trim())
      errors.push('Emergency contact email is required');
    if (!this.quote.emergencyContact.phone.trim())
      errors.push('Emergency contact phone is required');

    if (errors.length > 0) {
      this.validationErrors['details'] = errors;
      return false;
    }
    return true;
  }

  private validateSummary(): boolean {
    if (!this.summaryConfirmed) {
      this.validationErrors['summary'] = ['Please confirm the details are correct'];
      return false;
    }
    return true;
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

    this.showNationalityDropdown = new Array(this.quote.totalTravelers).fill(false);
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

  saveQuoteForLater(): void {
    console.log('Saving quote for later:', this.quote);
    alert(
      `Quote ${this.quote.id} has been saved! You can access it from your dashboard.`
    );
    this.resetToStart();
  }

  processPayment(): void {
    console.log('Processing payment for quote:', this.quote);
    // Redirect to payment gateway or handle payment processing
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