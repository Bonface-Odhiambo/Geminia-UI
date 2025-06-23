import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { TravelQuoteService } from './travel-quote.service';
import {
  TravelQuote,
  InsurancePlan,
  Customer,
} from './travel-quote.models';

@Component({
  selector: 'app-travel-quote',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './travel-quote.component.html',
  styleUrls: ['./travel-quote.component.scss'],
})
export class TravelQuoteComponent implements OnInit {
  currentStep = 1;
  quoteForm: FormGroup;
  kycForm: FormGroup;
  plans: InsurancePlan[] = [];
  selectedPlan: string | null = null;
  quote: TravelQuote | null = null;
  includeWarTerrorism = false;
  includeCovidExtension = false;

  // Form submission attempts tracking
  quoteFormSubmitted = false;
  kycFormSubmitted = false;

  steps = [
    { name: 'Quote Form', number: 1 },
    { name: 'Select a Plan', number: 2 },
    { name: 'View Quote', number: 3 },
    { name: 'Enter KYC Details', number: 4 },
    { name: 'Confirm Details', number: 5 },
    { name: 'Payment', number: 6 },
  ];

  countries = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi'];
  destinations = [
    'Algeria',
    'Morocco',
    'Egypt',
    'South Africa',
    'Nigeria',
    'Ghana',
  ];
  nationalities = ['Kenyan', 'Ugandan', 'Tanzanian', 'Rwandan', 'Burundian'];
  occupations = [
    'undefined',
    'Engineer',
    'Doctor',
    'Teacher',
    'Business',
    'Student',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    public quoteService: TravelQuoteService,
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.plans = this.quoteService.getInsurancePlans();
    this.quoteService.currentStep$.subscribe((step) => {
      this.currentStep = step;
    });
    this.quoteService.quote$.subscribe((quote) => {
      this.quote = quote;
    });
  }

  initializeForms(): void {
    this.quoteForm = this.fb.group({
      travellingFrom: ['Kenya', Validators.required],
      travellingTo: ['', Validators.required],
      departureDate: ['', Validators.required],
      returnDate: ['', Validators.required],
      numberOfDays: [0],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      dateOfBirth: ['', Validators.required],
      travelType: ['Individual', Validators.required],
      reasonForTravel: ['Leisure', Validators.required],
      referralName: [''],
      referralPhone: [''],
    });

    this.kycForm = this.fb.group({
      passportNumber: ['', [Validators.required, Validators.minLength(6)]],
      nationality: ['', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      otherNames: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['2009-06-19', Validators.required],
      age: [16, [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['', Validators.required],
      phoneNumber: [
        '+254',
        [Validators.required, Validators.pattern(/^0\d{9}$/)],
      ],
      email: ['', [Validators.required, Validators.email]],
      occupation: ['undefined', Validators.required],
      kycConsent1: [false, Validators.requiredTrue],
      kycConsent2: [false, Validators.requiredTrue],
    });

    this.quoteForm
      .get('departureDate')
      ?.valueChanges.subscribe(() => this.calculateDays());
    this.quoteForm
      .get('returnDate')
      ?.valueChanges.subscribe(() => this.calculateDays());
    this.quoteForm.get('dateOfBirth')?.valueChanges.subscribe((dob) => {
      if (dob) {
        const age = this.calculateAge(new Date(dob));
        this.quoteForm.patchValue({ age }, { emitEvent: false });
      }
    });

    this.quoteForm
      .get('returnDate')
      ?.setValidators([Validators.required, this.returnDateValidator.bind(this)]);
  }

  returnDateValidator(control: any) {
    const departureDate = this.quoteForm?.get('departureDate')?.value;
    const returnDate = control.value;

    if (departureDate && returnDate) {
      const departure = new Date(departureDate);
      const returnD = new Date(returnDate);

      if (returnD <= departure) {
        return { returnDateInvalid: true };
      }
    }
    return null;
  }

  calculateDays(): void {
    const departure = this.quoteForm.get('departureDate')?.value;
    const returnDate = this.quoteForm.get('returnDate')?.value;

    if (departure && returnDate) {
      const days = this.quoteService.calculateNumberOfDays(
        new Date(departure),
        new Date(returnDate),
      );
      this.quoteForm.patchValue({ numberOfDays: days }, { emitEvent: false });
    }
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  onQuoteFormSubmit(): void {
    this.quoteFormSubmitted = true;

    if (this.quoteForm.valid) {
      const formValue = this.quoteForm.value;
      const quote: Partial<TravelQuote> = {
        ...formValue,
        departureDate: new Date(formValue.departureDate),
        returnDate: new Date(formValue.returnDate),
        dateOfBirth: new Date(formValue.dateOfBirth),
      };

      this.quoteService.updateQuote(quote);
      this.nextStep();
    }
  }

  selectPlan(planName: string): void {
    this.selectedPlan = planName;
    const plan = this.plans.find((p) => p.name === planName);
    if (plan) {
      this.quoteService.updateQuote({ selectedPlan: plan });
    }
  }

  onKycFormSubmit(): void {
    this.kycFormSubmitted = true;

    if (this.kycForm.valid) {
      const customer: Customer = this.kycForm.value;
      this.quoteService.updateQuote({ customer });
      this.nextStep();
    }
  }

  nextStep(): void {
    if (this.currentStep < 6) {
      this.currentStep = this.currentStep + 1;
      this.quoteService.setCurrentStep(this.currentStep);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep = this.currentStep - 1;
      this.quoteService.setCurrentStep(this.currentStep);
    }
  }

  downloadQuote(): void {
    console.log('Downloading quote...');
  }

  payNow(): void {
    console.log('Processing payment...');
  }

  getTotalPremium(): number {
    if (!this.quote?.selectedPlan) return 0;

    let total = this.quote.selectedPlan.totalPremium;
    if (this.includeWarTerrorism) total += total * 0.25;
    if (this.includeCovidExtension) total += total * 0.20;

    return total;
  }

  getTotalPremiumKES(): number {
    return this.getTotalPremium() * 129.03;
  }

  isFieldInvalid(
    formGroup: FormGroup,
    fieldName: string,
    submitted: boolean,
  ): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || submitted));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['min'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['min'].min
        }`;
      if (field.errors['max'])
        return `${this.getFieldLabel(fieldName)} must be at most ${
          field.errors['max'].max
        }`;
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      if (field.errors['pattern'])
        return `Please enter a valid ${this.getFieldLabel(
          fieldName,
        ).toLowerCase()}`;
      if (field.errors['returnDateInvalid'])
        return 'Return date must be after departure date';
      if (field.errors['requiredTrue']) {
        if (fieldName === 'kycConsent1')
          return 'Please confirm you have filled the form to the best of your knowledge';
        if (fieldName === 'kycConsent2')
          return 'Please consent to the collection and processing of your data';
        return 'This field must be checked';
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      travellingFrom: 'Origin country',
      travellingTo: 'Destination country',
      departureDate: 'Departure date',
      returnDate: 'Return date',
      age: 'Age',
      dateOfBirth: 'Date of birth',
      travelType: 'Travel type',
      reasonForTravel: 'Reason for travel',
      passportNumber: 'Passport number',
      nationality: 'Nationality',
      firstName: 'First name',
      otherNames: 'Other names',
      gender: 'Gender',
      phoneNumber: 'Phone number',
      email: 'Email address',
      occupation: 'Occupation',
      kycConsent1: 'Knowledge confirmation',
      kycConsent2: 'Data processing consent',
    };
    return labels[fieldName] || fieldName;
  }

  getQuoteFormErrors(): string[] {
    const errors: string[] = [];

    Object.keys(this.quoteForm.controls).forEach((key) => {
      if (this.isFieldInvalid(this.quoteForm, key, this.quoteFormSubmitted)) {
        const error = this.getFieldError(this.quoteForm, key);
        if (error) errors.push(error);
      }
    });

    return errors;
  }

  getKycFormErrors(): string[] {
    const errors: string[] = [];

    Object.keys(this.kycForm.controls).forEach((key) => {
      if (this.isFieldInvalid(this.kycForm, key, this.kycFormSubmitted)) {
        const error = this.getFieldError(this.kycForm, key);
        if (error) errors.push(error);
      }
    });

    return errors;
  }

  getPlanSelectionError(): string {
    return this.selectedPlan ? '' : 'Please select an insurance plan to continue';
  }

  // New method for smooth scrolling
  scrollToForm(): void {
    const element = document.getElementById('quote-process-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}