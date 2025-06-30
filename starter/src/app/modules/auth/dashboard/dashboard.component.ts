import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

interface User {
  name: string;
  email: string;
  phoneNumber: string;
}

interface Quote {
  id: string;
  type: 'marine' | 'travel';
  title: string;
  amount: number;
  status: 'draft' | 'pending' | 'completed' | 'expired';
  createdDate: Date;
  expiryDate: Date;
  description: string;
}

interface Policy {
  id: string;
  type: 'marine' | 'travel';
  title: string;
  policyNumber: string;
  status: 'active' | 'expired' | 'cancelled';
  premium: number;
  startDate: Date;
  endDate: Date;
  certificateUrl?: string;
}

interface DashboardStats {
  marinePolicies: number;
  travelPolicies: number;
  pendingQuotes: number;
  totalPremium: number;
}

interface MpesaPayment {
  amount: number;
  phoneNumber: string;
  reference: string;
  description: string;
}

@Component({
  selector: 'app-mpesa-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="mpesa-modal-container">
      <div mat-dialog-title class="modal-header">
        <div class="flex items-center space-x-3">
          <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-gray-100">
            <img
              src="https://lenouveaumanager.info/wp-content/uploads/2021/09/Lipa-na-mpesa.png"
              alt="M-Pesa Logo"
              class="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">M-Pesa Payment</h2>
            <p class="text-sm text-gray-600">Secure mobile money payment</p>
          </div>
        </div>
        <button
          mat-icon-button
          mat-dialog-close
          class="text-gray-400 hover:text-gray-600"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="modal-content">
        <!-- Payment Details -->
        <div class="payment-summary">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Payment Summary
          </h3>
          <div class="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
            <div class="flex justify-between">
              <span class="text-gray-600">Policy/Quote:</span>
              <span class="font-medium text-gray-900">{{
                data.description
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Reference:</span>
              <span class="font-medium text-gray-900">{{
                data.reference
              }}</span>
            </div>
            <div class="flex justify-between items-center border-t border-gray-200 pt-3">
              <span class="text-gray-600">Amount:</span>
              <span class="text-2xl font-bold text-green-600"
                >KES {{ data.amount | number }}</span
              >
            </div>
          </div>
        </div>

        <!-- Phone Number Form -->
        <form [formGroup]="paymentForm" class="mt-6">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>M-Pesa Phone Number</mat-label>
            <input
              matInput
              placeholder="e.g., 254712345678"
              formControlName="phoneNumber"
              [disabled]="isProcessing"
            />
            <mat-icon matSuffix>phone</mat-icon>
            <mat-hint>Enter your M-Pesa registered phone number</mat-hint>
            <mat-error
              *ngIf="paymentForm.get('phoneNumber')?.invalid && paymentForm.get('phoneNumber')?.touched"
            >
              Please enter a valid Kenyan phone number (254XXXXXXXXX)
            </mat-error>
          </mat-form-field>
        </form>

        <!-- Payment Instructions -->
        <div class="payment-instructions mt-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <mat-icon class="text-green-600 !text-sm">info</mat-icon>
              </div>
              <div>
                <h4 class="font-medium text-green-900 mb-2">
                  Payment Instructions
                </h4>
                <ul class="text-sm text-green-800 space-y-1.5">
                  <li class="flex items-start">
                    <span class="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    You will receive an M-Pesa prompt on your phone
                  </li>
                  <li class="flex items-start">
                    <span class="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Enter your M-Pesa PIN to complete the payment
                  </li>
                  <li class="flex items-start">
                    <span class="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Payment confirmation will be sent via SMS
                  </li>
                  <li class="flex items-start">
                    <span class="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Your policy will be activated immediately
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing State -->
        <div *ngIf="isProcessing" class="processing-state mt-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center space-x-3">
              <mat-progress-spinner
                diameter="24"
                mode="indeterminate"
                class="text-blue-600"
              ></mat-progress-spinner>
              <div>
                <h4 class="font-medium text-blue-900">Processing Payment...</h4>
                <p class="text-sm text-blue-800">
                  Please check your phone for the M-Pesa prompt
                </p>
                <div class="mt-2 flex items-center space-x-2">
                  <img
                    src="https://lenouveaumanager.info/wp-content/uploads/2021/09/Lipa-na-mpesa.png"
                    alt="M-Pesa"
                    class="w-12 h-5 object-cover rounded"
                  />
                  <span class="text-xs text-blue-700">STK Push initiated...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div mat-dialog-actions class="modal-actions">
        <button
          mat-button
          mat-dialog-close
          [disabled]="isProcessing"
          class="text-gray-600 hover:text-gray-800 font-medium"
        >
          Cancel
        </button>
        <button
          mat-raised-button
          (click)="initiatePayment()"
          [disabled]="paymentForm.invalid || isProcessing"
          class="mpesa-pay-button"
        >
          <div class="flex items-center space-x-3">
            <img
              src="https://lenouveaumanager.info/wp-content/uploads/2021/09/Lipa-na-mpesa.png"
              alt="M-Pesa"
              class="w-8 h-3 object-cover filter brightness-0 invert rounded-sm"
            />
            <span class="font-medium">{{
              isProcessing ? 'Processing...' : 'Pay with M-Pesa'
            }}</span>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .mpesa-modal-container {
        max-width: 520px;
        width: 100%;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 24px 0;
        margin: 0;
      }

      .modal-content {
        padding: 24px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .modal-actions {
        padding: 0 24px 24px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .payment-summary {
        margin-bottom: 24px;
      }

      .mpesa-pay-button {
        background: linear-gradient(135deg, #00c851, #00a63f) !important;
        color: white !important;
        border: none !important;
        padding: 12px 24px !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        text-transform: none !important;
        box-shadow: 0 4px 12px rgba(0, 200, 81, 0.3) !important;
        transition: all 0.2s ease !important;
      }

      .mpesa-pay-button:hover:not(:disabled) {
        background: linear-gradient(135deg, #00a63f, #007e33) !important;
        box-shadow: 0 6px 16px rgba(0, 200, 81, 0.4) !important;
        transform: translateY(-1px);
      }

      .mpesa-pay-button:disabled {
        background: #e0e0e0 !important;
        color: #9e9e9e !important;
        box-shadow: none !important;
      }

      ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }

      ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-focus-overlay {
        background: rgba(0, 200, 81, 0.1);
      }

      ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
        color: #00c851 !important;
      }
    `,
  ],
})
export class MpesaPaymentModalComponent {
  paymentForm: FormGroup;
  isProcessing = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MpesaPaymentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MpesaPayment
  ) {
    this.paymentForm = this.fb.group({
      phoneNumber: [
        data.phoneNumber || '',
        [Validators.required, Validators.pattern(/^254[0-9]{9}$/)],
      ],
    });
  }

  initiatePayment(): void {
    if (this.paymentForm.valid) {
      this.isProcessing = true;

      // Simulate M-Pesa STK Push
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate

        if (success) {
          this.dialogRef.close({
            success: true,
            phoneNumber: this.paymentForm.value.phoneNumber,
            reference: this.data.reference,
          });
        } else {
          this.isProcessing = false;
          alert('❌ Payment failed. Please try again.');
        }
      }, 3000);
    }
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  user: User = {
    name: 'Bonface Odhiambo',
    email: 'bonface@example.com',
    phoneNumber: '+254712345678',
  };

  dashboardStats: DashboardStats = {
    marinePolicies: 0,
    travelPolicies: 0,
    pendingQuotes: 0,
    totalPremium: 0,
  };

  // Sample quotes data
  savedQuotes: Quote[] = [
    {
      id: 'Q001',
      type: 'marine',
      title: 'Cargo Insurance - Electronics',
      amount: 15000,
      status: 'draft',
      createdDate: new Date('2025-06-25'),
      expiryDate: new Date('2025-07-25'),
      description: 'Marine cargo insurance for electronics shipment',
    },
    {
      id: 'Q002',
      type: 'travel',
      title: 'Business Travel - Europe',
      amount: 2500,
      status: 'pending',
      createdDate: new Date('2025-06-20'),
      expiryDate: new Date('2025-07-20'),
      description: 'Travel insurance for business trip to Europe',
    },
    {
      id: 'Q003',
      type: 'marine',
      title: 'Hull Insurance - Vessel MV Ocean',
      amount: 45000,
      status: 'completed',
      createdDate: new Date('2025-06-15'),
      expiryDate: new Date('2025-07-15'),
      description: 'Hull insurance for commercial vessel',
    },
  ];

  // Sample policies data
  activePolicies: Policy[] = [
    {
      id: 'P001',
      type: 'marine',
      title: 'Marine Cargo Policy',
      policyNumber: 'MAR-2025-001',
      status: 'active',
      premium: 12000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      certificateUrl: '/certificates/MAR-2025-001.pdf',
    },
    {
      id: 'P002',
      type: 'travel',
      title: 'Annual Travel Policy',
      policyNumber: 'TRV-2025-001',
      status: 'active',
      premium: 3500,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      certificateUrl: '/certificates/TRV-2025-001.pdf',
    },
  ];

  // Sidebar toggle states
  isLifeInsuranceOpen = false;
  isGeneralInsuranceOpen = false;
  isQuotesOpen = false;

  constructor(private dialog: MatDialog, public router: Router) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Calculate dashboard statistics
    this.dashboardStats = {
      marinePolicies: this.activePolicies.filter((p) => p.type === 'marine')
        .length,
      travelPolicies: this.activePolicies.filter((p) => p.type === 'travel')
        .length,
      pendingQuotes: this.savedQuotes.filter(
        (q) => q.status === 'draft' || q.status === 'pending'
      ).length,
      totalPremium: this.activePolicies.reduce((sum, p) => sum + p.premium, 0),
    };
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  toggleLifeInsurance(): void {
    this.isLifeInsuranceOpen = !this.isLifeInsuranceOpen;
  }

  toggleGeneralInsurance(): void {
    this.isGeneralInsuranceOpen = !this.isGeneralInsuranceOpen;
  }

  toggleQuotes(): void {
    this.isQuotesOpen = !this.isQuotesOpen;
  }

  // Quote management methods with routing
  createNewQuote(type: 'marine' | 'travel'): void {
    console.log(`Creating new ${type} quote...`);
    if (type === 'marine') {
      this.router.navigate(['/marine-quote']);
    } else if (type === 'travel') {
      this.router.navigate(['/travel-quote']);
    }
  }

  editQuote(quoteId: string): void {
    const quote = this.savedQuotes.find((q) => q.id === quoteId);
    if (quote) {
      console.log(`Editing ${quote.type} quote ${quoteId}...`);
      if (quote.type === 'marine') {
        this.router.navigate(['/marine-quote'], {
          queryParams: { edit: quoteId },
        });
      } else if (quote.type === 'travel') {
        this.router.navigate(['/travel-quote'], {
          queryParams: { edit: quoteId },
        });
      }
    }
  }

  // M-Pesa Payment Integration with Modal
  initiateMpesaPayment(quoteId: string): void {
    const quote = this.savedQuotes.find((q) => q.id === quoteId);
    if (quote) {
      this.openMpesaModal({
        amount: quote.amount,
        phoneNumber: this.user.phoneNumber,
        reference: quote.id,
        description: quote.title,
      });
    }
  }

  makePolicyPayment(policyId: string): void {
    const policy = this.activePolicies.find((p) => p.id === policyId);
    if (policy) {
      this.openMpesaModal({
        amount: policy.premium,
        phoneNumber: this.user.phoneNumber,
        reference: policy.policyNumber,
        description: policy.title,
      });
    }
  }

  private openMpesaModal(paymentData: MpesaPayment): void {
    const dialogRef = this.dialog.open(MpesaPaymentModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: paymentData,
      disableClose: false,
      panelClass: 'mpesa-modal-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        this.handlePaymentSuccess(result.reference);
        this.showPaymentSuccessMessage(paymentData.amount);
      }
    });
  }

  private handlePaymentSuccess(reference: string): void {
    // Update quote/policy status after successful payment
    const quote = this.savedQuotes.find((q) => q.id === reference);
    if (quote) {
      quote.status = 'completed';
      this.loadDashboardData(); // Refresh stats
    }

    console.log(`Payment successful for reference: ${reference}`);
  }

  private showPaymentSuccessMessage(amount: number): void {
    setTimeout(() => {
      alert(
        `✅ Payment Successful!\n\nAmount: KES ${amount.toLocaleString()}\n\nYour policy has been activated and certificate will be emailed to you shortly.`
      );
    }, 500);
  }

  // Policy management methods
  downloadCertificate(policyId: string): void {
    const policy = this.activePolicies.find((p) => p.id === policyId);
    if (policy && policy.certificateUrl) {
      console.log(`Downloading certificate for policy ${policyId}...`);
      window.open(policy.certificateUrl, '_blank');
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPendingQuotes(): Quote[] {
    return this.savedQuotes.filter(
      (quote) => quote.status === 'draft' || quote.status === 'pending'
    );
  }

  getMarineQuotes(): Quote[] {
    return this.savedQuotes.filter((quote) => quote.type === 'marine');
  }

  getTravelQuotes(): Quote[] {
    return this.savedQuotes.filter((quote) => quote.type === 'travel');
  }

  // Logout functionality
  logout(): void {
    console.log('Logging out...');

    // Clear any stored user data/tokens
    localStorage.removeItem('userToken');
    sessionStorage.clear();

    // Navigate to sign-in page
    this.router.navigate(['/sign-in']);
  }
}