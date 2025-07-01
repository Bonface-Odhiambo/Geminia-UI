import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject, HostListener, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

type UserRole = 'individual' | 'corporate' | 'intermediary';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  companyName?: string;
  intermediaryCode?: string;
  avatar?: string;
  lastLogin?: Date;
  preferences?: {
    currency: string;
    language: string;
    notifications: boolean;
  };
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
  clientId?: string;
  progress?: number;
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
  clientId?: string;
  renewalDate?: Date;
}

interface DashboardStats {
  marinePolicies: number;
  travelPolicies: number;
  pendingQuotes: number;
  totalPremium: number;
  clientCount?: number;
  monthlyGrowth?: number;
  renewalsThisMonth?: number;
}

interface MpesaPayment {
  amount: number;
  phoneNumber: string;
  reference: string;
  description: string;
}

interface NavigationItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  children?: NavigationItem[];
  roles?: UserRole[];
  badge?: number;
  isExpanded?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
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
      <!-- Header -->
      <div class="modal-header bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-green-100">
              <div class="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <span class="text-white font-bold text-sm">M</span>
              </div>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">M-Pesa Payment</h2>
              <p class="text-green-600 font-medium">Secure mobile money payment</p>
            </div>
          </div>
          <button mat-icon-button mat-dialog-close class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-content p-6 space-y-6">
        <!-- Payment Summary -->
        <div class="payment-summary">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 font-medium">Policy/Quote:</span>
                <span class="font-bold text-gray-900">{{ data.description }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 font-medium">Reference:</span>
                <span class="font-mono text-sm bg-gray-200 px-3 py-1 rounded-lg">{{ data.reference }}</span>
              </div>
              <div class="border-t border-gray-300 pt-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 font-medium">Amount:</span>
                  <div class="text-right">
                    <span class="text-3xl font-bold text-green-600">KES {{ data.amount | number }}</span>
                    <p class="text-sm text-gray-500">Including all fees</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Phone Number Form -->
        <form [formGroup]="paymentForm" class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">M-Pesa Phone Number *</label>
            <mat-form-field appearance="outline" class="w-full premium-form-field">
              <input
                matInput
                placeholder="e.g., 254712345678"
                formControlName="phoneNumber"
                [disabled]="isProcessing"
                class="text-lg"
              />
              <mat-icon matSuffix class="text-green-600">phone</mat-icon>
              <mat-hint class="text-green-600">Enter your M-Pesa registered phone number</mat-hint>
              <mat-error *ngIf="paymentForm.get('phoneNumber')?.invalid && paymentForm.get('phoneNumber')?.touched">
                Please enter a valid Kenyan phone number (254XXXXXXXXX)
              </mat-error>
            </mat-form-field>
          </div>
        </form>

        <!-- Payment Instructions -->
        <div class="payment-instructions">
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
            <div class="flex items-start space-x-4">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <mat-icon class="text-green-600">info</mat-icon>
              </div>
              <div class="flex-1">
                <h4 class="font-bold text-green-900 mb-3 text-lg">Payment Instructions</h4>
                <div class="space-y-3">
                  <div class="flex items-start space-x-3">
                    <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs font-bold">1</span>
                    </div>
                    <p class="text-green-800 font-medium">You will receive an M-Pesa prompt on your phone</p>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs font-bold">2</span>
                    </div>
                    <p class="text-green-800 font-medium">Enter your M-Pesa PIN to complete the payment</p>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs font-bold">3</span>
                    </div>
                    <p class="text-green-800 font-medium">Payment confirmation will be sent via SMS</p>
                  </div>
                  <div class="flex items-start space-x-3">
                    <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs font-bold">4</span>
                    </div>
                    <p class="text-green-800 font-medium">Your policy will be activated immediately</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing State -->
        <div *ngIf="isProcessing" class="processing-state">
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
            <div class="flex items-center space-x-4">
              <mat-progress-spinner diameter="40" mode="indeterminate" color="primary"></mat-progress-spinner>
              <div class="flex-1">
                <h4 class="font-bold text-blue-900 text-lg">Processing Payment...</h4>
                <p class="text-blue-800 font-medium">Please check your phone for the M-Pesa prompt</p>
                <div class="mt-3 flex items-center space-x-3">
                  <div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-xs">M</span>
                  </div>
                  <span class="text-blue-700 font-medium">STK Push initiated...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-actions p-6 border-t border-gray-200 bg-gray-50">
        <div class="flex space-x-3 justify-end">
          <button
            mat-button
            mat-dialog-close
            [disabled]="isProcessing"
            class="px-6 py-3 text-gray-600 hover:text-gray-800 font-bold border border-gray-300 rounded-xl hover:bg-gray-100 transition-all">
            Cancel
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="initiatePayment()"
            [disabled]="paymentForm.invalid || isProcessing"
            class="premium-button px-8 py-3 text-lg font-bold flex items-center space-x-3 rounded-xl bg-green-600 hover:bg-green-700 text-white">
            <div class="w-6 h-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xs">M</span>
            </div>
            <span>{{ isProcessing ? 'Processing...' : 'Pay with M-Pesa' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mpesa-modal-container {
      max-width: 600px;
      width: 100vw;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    }
    
    .premium-form-field ::ng-deep .mat-mdc-form-field-outline {
      border-radius: 12px;
      border-width: 2px;
    }
    
    .premium-form-field.mat-focused ::ng-deep .mat-mdc-form-field-outline {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .premium-button {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      border: none !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
    }

    .premium-button:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
    }
  `]
})
export class MpesaPaymentModalComponent implements OnInit {
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
        [Validators.required, Validators.pattern(/^254[0-9]{9}$/)]
      ],
    });
  }

  ngOnInit(): void {
    // Auto-focus phone number field
    setTimeout(() => {
      const phoneInput = document.querySelector('input[formControlName="phoneNumber"]') as HTMLInputElement;
      if (phoneInput) {
        phoneInput.focus();
      }
    }, 100);
  }

  initiatePayment(): void {
    if (this.paymentForm.valid) {
      this.isProcessing = true;

      // Simulate M-Pesa STK Push with realistic timing
      setTimeout(() => {
        const success = Math.random() > 0.15; // 85% success rate

        if (success) {
          this.dialogRef.close({
            success: true,
            phoneNumber: this.paymentForm.value.phoneNumber,
            reference: this.data.reference,
            transactionId: `MP${Date.now()}`,
            timestamp: new Date()
          });
        } else {
          this.isProcessing = false;
          // Could show error state here instead of alert
        }
      }, 3500);
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
    MatBadgeModule,
    MatSnackBarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  user: User = {
    id: 'U001',
    name: 'Bonface Odhiambo',
    email: 'bonface@example.com',
    phoneNumber: '+254712345678',
    role: 'individual',
    lastLogin: new Date(),
    preferences: {
      currency: 'KES',
      language: 'en',
      notifications: true
    }
  };

  dashboardStats: DashboardStats = {
    marinePolicies: 0,
    travelPolicies: 0,
    pendingQuotes: 0,
    totalPremium: 0,
    clientCount: 0,
    monthlyGrowth: 12.5,
    renewalsThisMonth: 3
  };

  notifications: Notification[] = [
    {
      id: 'N001',
      title: 'Quote Expiry Reminder',
      message: 'Your travel insurance quote expires in 2 days',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      actionUrl: '/quotes/Q002'
    },
    {
      id: 'N002', 
      title: 'Payment Received',
      message: 'M-Pesa payment of KES 2,500 received successfully',
      type: 'success',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false
    },
    {
      id: 'N003',
      title: 'Policy Renewal',
      message: 'Marine policy renewal available',
      type: 'info',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true
    }
  ];

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
      progress: 65
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
      progress: 90
    }
  ];

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
      renewalDate: new Date('2025-11-01')
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
      renewalDate: new Date('2025-10-15')
    }
  ];

  navigationItems: NavigationItem[] = [];
  
  // UI State
  isMobileSidebarOpen = false;
  isQuotesOpen = false; // Add this property for dropdown functionality
  isLoading = false;
  currentTime = new Date();
  screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  constructor(
    private dialog: MatDialog, 
    public router: Router,
    private snackBar: MatSnackBar
  ) {
    this.updateScreenSize();
  }

  ngOnInit(): void {
    this.setupNavigationBasedOnRole();
    this.loadDashboardData();
    this.startTimeUpdate();
    this.markNotificationsAsRead();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updateScreenSize();
  }

  private updateScreenSize(): void {
    const width = window.innerWidth;
    if (width < 768) {
      this.screenSize = 'mobile';
    } else if (width < 1024) {
      this.screenSize = 'tablet';
    } else {
      this.screenSize = 'desktop';
    }
  }

  private startTimeUpdate(): void {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  private markNotificationsAsRead(): void {
    setTimeout(() => {
      this.notifications.forEach(n => {
        if (!n.read && Date.now() - n.timestamp.getTime() > 5000) {
          n.read = true;
        }
      });
    }, 5000);
  }

  setupNavigationBasedOnRole(): void {
    const baseNavigation: NavigationItem[] = [
      {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
        roles: ['individual', 'corporate', 'intermediary']
      }
    ];

    const roleSpecificNavigation: { [key in UserRole]: NavigationItem[] } = {
      individual: [
        {
          label: 'My Quotes',
          icon: 'description',
          children: [
            { label: 'Draft Quotes', icon: 'drafts', route: '/quotes/draft' },
            { label: 'Pending Payment', icon: 'payment', route: '/quotes/pending' },
            { label: 'Completed', icon: 'check_circle', route: '/quotes/completed' }
          ],
          badge: this.getPendingQuotes().length,
          isExpanded: false
        },
        {
          label: 'Marine Insurance',
          icon: 'directions_boat',
          children: [
            { label: 'Active Policies', icon: 'shield', route: '/marine-policies' },
            { label: 'Claims', icon: 'assignment', route: '/marine-claims' },
            { label: 'New Quote', icon: 'add_circle', route: '/sign-up/marine-quote' }
          ],
          isExpanded: false
        },
        {
          label: 'Travel Insurance',
          icon: 'flight',
          children: [
            { label: 'Active Policies', icon: 'shield', route: '/travel-policies' },
            { label: 'Claims History', icon: 'history', route: '/travel-claims' },
            { label: 'New Quote', icon: 'add_circle', route: '/sign-up/travel-quote' }
          ],
          isExpanded: false
        }
      ],
      corporate: [
        {
          label: 'Company Overview',
          icon: 'business',
          children: [
            { label: 'All Policies', icon: 'shield', route: '/corporate-policies' },
            { label: 'Employee Coverage', icon: 'group', route: '/employee-coverage' },
            { label: 'Analytics', icon: 'analytics', route: '/corporate-analytics' }
          ],
          isExpanded: false
        },
        {
          label: 'Fleet Management',
          icon: 'local_shipping',
          children: [
            { label: 'Marine Fleet', icon: 'directions_boat', route: '/marine-fleet' },
            { label: 'Vehicle Fleet', icon: 'directions_car', route: '/vehicle-fleet' }
          ],
          isExpanded: false
        }
      ],
      intermediary: [
        {
          label: 'Client Management',
          icon: 'people',
          children: [
            { label: 'All Clients', icon: 'list', route: '/clients' },
            { label: 'Add Client', icon: 'person_add', route: '/add-client' },
            { label: 'Client Analytics', icon: 'analytics', route: '/client-analytics' }
          ],
          isExpanded: false
        },
        {
          label: 'Commission',
          icon: 'account_balance_wallet',
          children: [
            { label: 'Monthly Reports', icon: 'assessment', route: '/commission-reports' },
            { label: 'Payment History', icon: 'payment', route: '/commission-history' }
          ],
          isExpanded: false
        }
      ]
    };

    this.navigationItems = [
      ...baseNavigation,
      ...roleSpecificNavigation[this.user.role]
    ];
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      switch (this.user.role) {
        case 'individual':
          this.loadIndividualData();
          break;
        case 'corporate':
          this.loadCorporateData();
          break;
        case 'intermediary':
          this.loadIntermediaryData();
          break;
      }
      this.isLoading = false;
    }, 800);
  }

  private loadIndividualData(): void {
    this.dashboardStats = {
      marinePolicies: this.activePolicies.filter(p => p.type === 'marine').length,
      travelPolicies: this.activePolicies.filter(p => p.type === 'travel').length,
      pendingQuotes: this.savedQuotes.filter(q => q.status === 'draft' || q.status === 'pending').length,
      totalPremium: this.activePolicies.reduce((sum, p) => sum + p.premium, 0),
      monthlyGrowth: 8.5,
      renewalsThisMonth: 1
    };
  }

  private loadCorporateData(): void {
    this.dashboardStats = {
      marinePolicies: 15,
      travelPolicies: 8,
      pendingQuotes: 3,
      totalPremium: 450000,
      clientCount: 250,
      monthlyGrowth: 15.2,
      renewalsThisMonth: 5
    };
  }

  private loadIntermediaryData(): void {
    this.dashboardStats = {
      marinePolicies: 85,
      travelPolicies: 42,
      pendingQuotes: 12,
      totalPremium: 2850000,
      clientCount: 124,
      monthlyGrowth: 22.8,
      renewalsThisMonth: 8
    };
  }

  // UI Helper Methods
  getInitials(name: string): string {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  getRoleDisplayName(): string {
    const roleNames = {
      individual: 'Individual Client',
      corporate: 'Corporate Client', 
      intermediary: 'Insurance Intermediary'
    };
    return roleNames[this.user.role];
  }

  getRoleColor(): string {
    const roleColors = {
      individual: 'role-indicator individual',
      corporate: 'role-indicator corporate',
      intermediary: 'role-indicator intermediary'
    };
    return roleColors[this.user.role];
  }

  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Navigation Methods - Fixed dropdown functionality
  toggleQuotes(): void {
    this.isQuotesOpen = !this.isQuotesOpen;
  }

  toggleNavItem(item: NavigationItem): void {
    if (item.children) {
      item.isExpanded = !item.isExpanded;
    }
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }

  // Business Logic Methods
  createNewQuote(type: 'marine' | 'travel'): void {
    const routes = {
      marine: '/sign-up/marine-quote',
      travel: '/sign-up/travel-quote'
    };
    this.router.navigate([routes[type]]);
    this.closeMobileSidebar();
  }

  editQuoteByType(quoteId: string, type: 'marine' | 'travel'): void {
    const routes = {
      marine: '/sign-up/marine-quote',
      travel: '/sign-up/travel-quote'
    };
    this.router.navigate([routes[type]], { queryParams: { editId: quoteId } });
  }

  initiateMpesaPayment(quoteId: string): void {
    const quote = this.savedQuotes.find(q => q.id === quoteId);
    if (quote) {
      this.openMpesaModal({
        amount: quote.amount,
        phoneNumber: this.user.phoneNumber,
        reference: quote.id,
        description: quote.title,
      });
    }
  }

  private openMpesaModal(paymentData: MpesaPayment): void {
    const dialogRef = this.dialog.open(MpesaPaymentModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: paymentData,
      disableClose: false,
      panelClass: 'mpesa-modal-panel',
      hasBackdrop: true,
      backdropClass: 'modal-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.handlePaymentSuccess(result);
      }
    });
  }

  private handlePaymentSuccess(result: any): void {
    const quote = this.savedQuotes.find(q => q.id === result.reference);
    if (quote) {
      quote.status = 'completed';
      this.loadDashboardData();
      
      // Show success message
      this.snackBar.open(
        `Payment of KES ${quote.amount.toLocaleString()} completed successfully!`,
        'View Policy',
        {
          duration: 5000,
          panelClass: 'success-snackbar'
        }
      );
    }
  }

  downloadCertificate(policyId: string): void {
    const policy = this.activePolicies.find(p => p.id === policyId);
    if (policy && policy.certificateUrl) {
      // Simulate download
      this.snackBar.open('Certificate download started', 'Close', { duration: 3000 });
      
      // In real app, this would trigger actual download
      window.open(policy.certificateUrl, '_blank');
    }
  }

  markNotificationAsRead(notification: Notification): void {
    notification.read = true;
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  getStatusColor(status: string): string {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  }

  getPendingQuotes(): Quote[] {
    return this.savedQuotes.filter(quote => quote.status === 'draft' || quote.status === 'pending');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: this.user.preferences?.currency || 'KES'
    }).format(amount);
  }

  logout(): void {
    // Show confirmation
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      localStorage.removeItem('userToken');
      sessionStorage.clear();
      this.router.navigate(['/sign-in']);
    }
  }
}