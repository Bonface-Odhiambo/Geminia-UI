import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule, formatNumber } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-marine-insurance-portal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatTooltipModule,
    MatTabsModule,
    MatProgressBarModule,
  ],
  templateUrl: './marine-insurance.component.html',
  styleUrls: ['./marine-insurance.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '300ms ease-in',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
})
export class MarineInsurancePortalComponent implements OnInit {
  // --- STATE MANAGEMENT ---
  currentView: string = 'login'; // Controls which "page" is shown
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  showOnboardingMessage: boolean = false;
  claimStep: number = 1;

  // --- FORM GROUPS ---
  loginForm: FormGroup;
  registrationForm: FormGroup;
  coverSelectionForm: FormGroup;
  singleTransitForm: FormGroup;
  quoteRetrievalForm: FormGroup;
  openCoverForm: FormGroup;
  paymentForm: FormGroup;
  claimsForm: FormGroup;
  adminFilterForm: FormGroup;

  // --- DATA & SIMULATION ---
  retrievedQuote: any = null;
  policyDetails: any = null;
  quoteSummary: any = { premium: 0, levies: 0, total: 0 };

  constructor(private fb: FormBuilder) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Recalculate quote summary on form changes
    this.singleTransitForm.valueChanges.subscribe(() => {
      this.calculateQuoteSummary();
    });
  }

  private initializeForms(): void {
    // Prompt 1: Login
    this.loginForm = this.fb.group({
      email: ['intermediary@geminia.com', [Validators.required, Validators.email]],
      password: ['password', Validators.required],
      role: ['intermediary', Validators.required],
    });

    // Prompt 2: Registration
    this.registrationForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      intermediaryCode: [''],
      consent1: [false, Validators.requiredTrue],
      consent2: [false, Validators.requiredTrue],
      consent3: [false, Validators.requiredTrue],
    });

    // Prompt 3: Cover Selection
    this.coverSelectionForm = this.fb.group({
      accountType: ['', Validators.required],
      coverType: [''],
    });

    // Prompt 4: Single Transit Quote
    this.singleTransitForm = this.fb.group({
      tradeType: ['import', Validators.required],
      modeOfShipment: ['sea', Validators.required],
      origin: ['Shanghai', Validators.required],
      destination: ['Mombasa', Validators.required],
      shippingDate: [new Date(), Validators.required],
      currency: ['KES', Validators.required],
      coverType: ['ICCA', Validators.required],
      goodsDescription: ['Electronics', Validators.required],
      sumInsured: [500000, Validators.required],
      ucrNumber: ['UCR12345678'],
      idfNumber: ['IDF987654321', Validators.required],
      addOns: this.fb.group({
        war: [true],
        sri_cc: [true],
        storage: [false],
      }),
    });

    // Prompt 5: Quote Retrieval
    this.quoteRetrievalForm = this.fb.group({
      reference: ['QTE-12345'],
    });

    // Prompt 6: Open Cover
    this.openCoverForm = this.fb.group({
      contractRef: [{ value: 'MOC-GEM-001', disabled: true }],
      idf: ['', Validators.required],
      ucr: [''],
      vessel: ['', Validators.required],
      shipmentDate: [null, Validators.required],
      cargoValue: [null, Validators.required],
    });

    // Prompt 7: Payment
    this.paymentForm = this.fb.group({
      paymentMethod: ['mpesa'],
    });

    // Prompt 9: Claims
    this.claimsForm = this.fb.group({
      certificateNumber: ['AMI-12345', Validators.required],
      dateOfLoss: [null, Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      contactInfo: ['', Validators.required],
      documents: [null],
    });

    // Prompt 10: Admin
    this.adminFilterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      status: [''],
      accountType: [''],
    });
  }

  // --- VIEW NAVIGATION ---
  setView(view: string): void {
    this.currentView = view;
    // Reset states when changing views
    this.retrievedQuote = null;
    this.showOnboardingMessage = false;
    if (view === 'claims') this.claimStep = 1;
  }

  // --- ACTIONS & LOGIC ---
  login(): void {
    if (this.loginForm.valid) {
      this.isLoggedIn = true;
      this.userRole = this.loginForm.value.role;
      this.setView(this.userRole === 'admin' ? 'adminDashboard' : 'dashboard');
    }
  }

  logout(): void {
    this.isLoggedIn = false;
    this.userRole = null;
    this.setView('login');
  }

  register(): void {
    if (this.registrationForm.valid) {
      this.showOnboardingMessage = true;
      setTimeout(() => this.setView('login'), 3000);
    }
  }

  getQuote(): void {
    if (this.coverSelectionForm.valid) {
      const cover = this.coverSelectionForm.value.coverType;
      if (cover === 'single') this.setView('singleTransitQuote');
      if (cover === 'open') this.setView('openCoverQuote');
    }
  }

  calculateQuoteSummary(): void {
    const sumInsured = this.singleTransitForm.get('sumInsured').value || 0;
    const baseRate = 0.005; // 0.5%
    const premium = sumInsured * baseRate;
    const levies = premium * 0.045; // 4.5%
    const stampDuty = 40;
    const total = premium + levies + stampDuty;
    this.quoteSummary = { premium, levies, stampDuty, total };
  }

  retrieveQuote(): void {
    if (this.quoteRetrievalForm.valid) {
      this.retrievedQuote = {
        ref: this.quoteRetrievalForm.value.reference,
        sumInsured: 500000,
        premium: 2540,
        status: 'Expired',
        expiryDate: '2025-06-20',
      };
    }
  }

  buyNow(quote: any): void {
    this.policyDetails = quote;
    this.setView('payment');
  }

  submitPayment(): void {
    this.policyDetails.status = 'Paid';
    this.setView('confirmation');
  }

  submitClaim(): void {
    if (this.claimsForm.valid) {
      this.claimStep = 4; // Move to confirmation step
    }
  }
}