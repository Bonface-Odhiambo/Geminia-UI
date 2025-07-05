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

// --- TYPE DEFINITIONS ---

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

interface Activity {
  id: string;
  type: 'quote_created' | 'quote_paid' | 'policy_downloaded' | 'payment_made' | 'policy_renewed' | 'claim_submitted' | 'profile_updated';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  iconColor: string;
  amount?: number;
  relatedId?: string;
}

// --- MPESA PAYMENT MODAL COMPONENT ---

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
      <!-- Premium Header with Gradient -->
      <div class="modal-header">
        <div class="header-content">
          <div class="brand-section">
            <div class="logo-container">
              <div class="logo-background">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" 
                  alt="M-PESA" 
                  class="logo-image"
                />
              </div>
            </div>
            <div class="brand-text">
              <h1 class="modal-title">M-PESA Payment</h1>
              <p class="modal-subtitle">Secure • Fast • Reliable</p>
            </div>
          </div>
          <button 
            mat-icon-button 
            mat-dialog-close 
            class="close-button"
            [disabled]="isProcessing">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <!-- Decorative Elements -->
        <div class="header-decoration">
          <div class="decoration-circle decoration-1"></div>
          <div class="decoration-circle decoration-2"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="modal-body">
        
        <!-- Phone Number Input -->
        <form [formGroup]="paymentForm" class="phone-form">
          <mat-form-field appearance="outline" class="phone-field">
            <mat-label>M-PESA Phone Number</mat-label>
            <input
              matInput
              placeholder="+254712345678"
              formControlName="phoneNumber"
              [disabled]="isProcessing"
              maxlength="13"
              type="tel"
            />
            <mat-icon matSuffix class="input-suffix-icon">smartphone</mat-icon>
          </mat-form-field>
          <div class="validation-message" *ngIf="paymentForm.get('phoneNumber')?.invalid && paymentForm.get('phoneNumber')?.touched">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <span>Please enter a valid Kenyan phone number.</span>
          </div>
        </form>

        <!-- Payment Instructions -->
        <div class="instructions-section">
          <div class="instructions-header">
            <mat-icon class="instructions-icon">info</mat-icon>
            <span class="instructions-title">How it works</span>
          </div>
          
          <div class="instructions-list">
            <div class="instruction-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title">STK Push</div>
                <div class="step-description">You'll receive a payment prompt on your phone</div>
              </div>
            </div>
            
            <div class="instruction-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">Enter PIN</div>
                <div class="step-description">Enter your M-PESA PIN to authorize payment</div>
              </div>
            </div>
            
            <div class="instruction-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title">Confirmation</div>
                <div class="step-description">Receive SMS confirmation and receipt</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons Below Content -->
        <div class="modal-actions">
          <button
            mat-stroked-button
            mat-dialog-close
            [disabled]="isProcessing"
            class="cancel-button">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
          
          <button
            mat-raised-button
            (click)="initiatePayment()"
            [disabled]="paymentForm.invalid || isProcessing"
            class="pay-button">
            <mat-icon>payment</mat-icon>
            <span>{{ isProcessing ? 'Processing...' : 'Pay Now' }}</span>
          </button>
        </div>

        <!-- Processing State -->
        <div class="processing-overlay" *ngIf="isProcessing">
           <mat-progress-spinner 
              diameter="50" 
              mode="indeterminate"
              strokeWidth="5">
            </mat-progress-spinner>
            <p class="processing-subtitle">Sending prompt to your phone...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-color: #0ea5e9; /* sky-500 */
      --primary-dark: #0284c7;  /* sky-600 */
      --error-color: #ef4444;
      --text-primary: #1f2937;
      --text-secondary: #6b7280;
      --background: #ffffff;
      --surface: #f8fafc; /* cool-gray-50 */
      --border: #e2e8f0;   /* cool-gray-200 */
    }

    .mpesa-modal-container {
      max-width: 440px;
      width: 100%;
      border-radius: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      background: var(--surface);
      overflow: hidden;
      position: relative;
    }

    /* Header Styles */
    .modal-header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .brand-section { display: flex; align-items: center; gap: 16px; }

    .logo-background {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-image { width: 28px; height: 20px; object-fit: contain; }
    .brand-text { color: white; }
    .modal-title { font-size: 22px; font-weight: 700; margin: 0 0 2px 0; }
    .modal-subtitle { font-size: 13px; margin: 0; opacity: 0.9; }

    .close-button {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      backdrop-filter: blur(10px);
    }
    .header-decoration { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; }
    .decoration-circle { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.08); }
    .decoration-1 { width: 100px; height: 100px; top: -50px; right: -50px; }
    .decoration-2 { width: 60px; height: 60px; bottom: -30px; left: -30px; }

    /* Body Styles */
    .modal-body {
      padding: 24px;
      position: relative;
      background: var(--background);
    }

    /* Phone Form Styles */
    .phone-form {
      margin-bottom: 24px;
    }

    .phone-field {
      width: 100%;
    }
    
    .phone-field ::ng-deep .mat-mdc-form-field-outline {
      border-radius: 12px !important;
    }
    .input-suffix-icon { color: var(--primary-color); }
    .validation-message { display: flex; align-items: center; gap: 6px; margin-top: 6px; color: var(--error-color); font-size: 12px; font-weight: 500; }
    .error-icon { font-size: 16px; }

    /* Instructions Section */
    .instructions-section {
      background: var(--surface);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--border);
    }

    .instructions-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .instructions-icon { color: var(--primary-color); font-size: 20px; }
    .instructions-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
    .instructions-list { display: flex; flex-direction: column; gap: 16px; }
    .instruction-item { display: flex; align-items: flex-start; gap: 12px; }
    .step-number { width: 24px; height: 24px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
    .step-description { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }

    /* Action Buttons at the bottom */
    .modal-actions {
      display: flex;
      gap: 16px;
      margin-top: 24px;
    }

    .cancel-button, .pay-button {
      flex: 1;
      height: 48px;
      border-radius: 9999px !important; /* Pill-shaped buttons */
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s ease;
    }
    
    .cancel-button {
      border-color: var(--border) !important;
      color: var(--text-secondary);
    }
    
    .cancel-button:hover:not(:disabled) {
      border-color: var(--text-secondary) !important;
      background: var(--surface);
    }

    .pay-button {
      flex: 1.5; /* Makes Pay button slightly wider */
      background: var(--primary-color); 
      color: white;
      box-shadow: none !important;
    }

    .pay-button:hover:not(:disabled) {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }

    .pay-button:disabled, .cancel-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Processing Overlay */
    .processing-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 10;
    }
    .processing-overlay ::ng-deep .mat-mdc-progress-spinner {
      --mdc-circular-progress-active-indicator-color: var(--primary-color);
    }
    .processing-subtitle { font-size: 14px; color: var(--text-secondary); }
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
        [Validators.required, Validators.pattern(/^\+254[0-9]{9}$/)]
      ],
    });
  }

  ngOnInit(): void {
    // Auto-focus the phone number input for better UX
    setTimeout(() => {
      const phoneInput = document.querySelector('input[formControlName="phoneNumber"]') as HTMLInputElement;
      if (phoneInput) {
        phoneInput.focus();
      }
    }, 300);
  }

  initiatePayment(): void {
    if (this.paymentForm.invalid) {
      return;
    }

    this.isProcessing = true;
    
    // Simulate API call for M-Pesa STK Push
    setTimeout(() => {
      const success = Math.random() > 0.15; // 85% success rate for demo

      if (success) {
        this.dialogRef.close({ success: true, ...this.paymentForm.value, reference: this.data.reference });
      } else {
        this.isProcessing = false;
        // In a real app, you would show a user-friendly error (e.g., a snackbar)
        console.error('Simulated M-Pesa payment failure.');
      }
    }, 4000); // Simulate network latency
  }
}

// --- DASHBOARD COMPONENT ---

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
  template: `
    <div class="min-h-screen w-screen bg-gray-50 flex">
      <!-- Sidebar -->
      <div class="w-64 sidebar-gradient text-white flex flex-col" [class.mobile-open]="isMobileSidebarOpen">
        <!-- Logo/Brand Section -->
        <div class="p-6 border-b border-white-20">
          <div class="flex items-center space-x-3">
            <div class="w-20 h-20 flex items-center justify-center">
              <img 
                src="https://geminialife.co.ke/wp-content/uploads/2022/06/thumbnail_GEMINIA-FINAL-LOGO-png.png" 
                alt="Geminia Insurance Logo" 
                class="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 class="text-lg font-bold">GEMINIA</h1>
              <p class="text-xs text-white-80">INSURANCE</p>
              <p class="text-xs text-white-70">{{ getRoleDisplayName() }}</p>
            </div>
          </div>
        </div>

        <!-- User Profile Section -->
        <div class="p-6 border-b border-white-20 user-profile-section">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="w-12 h-12 bg-white-20 rounded-full flex items-center justify-center">
                <span class="text-white font-semibold text-lg">{{ getInitials(user.name) }}</span>
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full {{ getRoleColor() }} border-2 border-white"></div>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-white">Welcome, {{ user.name.split(' ')[1] }}</h3>
              <h2 class="font-bold text-white">{{ user.name.split(' ')[0] }}</h2>
              <p class="text-white-70 text-sm">{{ user.email }}</p>
              <p class="text-white-70 text-xs">{{ user.phoneNumber }}</p>
              <div *ngIf="user.role === 'corporate' && user.companyName" class="text-white-80 text-xs mt-1">
                {{ user.companyName }}
              </div>
              <div *ngIf="user.role === 'intermediary' && user.intermediaryCode" class="text-white-80 text-xs mt-1">
                ID: {{ user.intermediaryCode }}
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 p-4">
          <div class="space-y-2">
            <ng-container *ngFor="let item of navigationItems">
              <!-- Simple menu item -->
              <a *ngIf="!item.children && item.route"
                 [routerLink]="item.route"
                 routerLinkActive="active-menu-item"
                 class="nav-menu-item flex items-center space-x-3 px-4 py-3 rounded-lg text-white-80 hover:bg-white-10 hover:text-white transition-all">
                <mat-icon class="sidebar-nav-icon">{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
                <span *ngIf="item.badge && item.badge > 0" 
                      class="ml-auto bg-white-20 text-xs px-2 py-1 rounded-full">
                  {{ item.badge }}
                </span>
              </a>

              <!-- Dropdown menu item -->
              <div *ngIf="item.children" class="space-y-1">
                <button 
                  (click)="toggleNavItem(item)"
                  class="nav-menu-item w-full flex items-center justify-between px-4 py-3 rounded-lg text-white-80 hover:bg-white-10 hover:text-white transition-all">
                  <div class="flex items-center space-x-3">
                    <mat-icon class="sidebar-nav-icon">{{ item.icon }}</mat-icon>
                    <span>{{ item.label }}</span>
                    <span *ngIf="item.badge && item.badge > 0" 
                          class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {{ item.badge }}
                    </span>
                  </div>
                  <mat-icon class="sidebar-nav-icon" [class.rotate-180]="item.isExpanded" class="transition-transform">
                    expand_more
                  </mat-icon>
                </button>
                
                <div *ngIf="item.isExpanded" class="ml-6 space-y-1">
                  <ng-container *ngFor="let child of item.children">
                    <a *ngIf="child.route"
                       [routerLink]="child.route"
                       class="block w-full text-left px-4 py-2 text-sm text-white-70 hover:text-white hover:bg-white-10 rounded-lg transition-colors">
                      <div class="flex items-center space-x-2">
                        <mat-icon class="sidebar-nav-icon !text-sm">{{ child.icon }}</mat-icon>
                        <span>{{ child.label }}</span>
                      </div>
                    </a>
                    <button *ngIf="child.action"
                            (click)="child.action!()"
                            class="block w-full text-left px-4 py-2 text-sm text-white-70 hover:text-white hover:bg-white-10 rounded-lg transition-colors">
                      <div class="flex items-center space-x-2">
                        <mat-icon class="sidebar-nav-icon !text-sm">{{ child.icon }}</mat-icon>
                        <span>{{ child.label }}</span>
                      </div>
                    </button>
                  </ng-container>
                </div>
              </div>
            </ng-container>
          </div>
        </nav>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button mat-icon-button (click)="toggleMobileSidebar()" class="lg:hidden">
                <mat-icon>menu</mat-icon>
              </button>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 lg:hidden">
                  <img 
                    src="https://geminialife.co.ke/wp-content/uploads/2022/06/thumbnail_GEMINIA-FINAL-LOGO-png.png" 
                    alt="Geminia Insurance Logo" 
                    class="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <p class="text-sm text-gray-600">
                    {{ user.role === 'individual' ? 'Overview of your insurance portfolio' : 
                       user.role === 'corporate' ? 'Corporate insurance overview' : 
                       'Client portfolio management' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-4">
              <!-- Notifications - Updated to use your brand color -->
              <button mat-icon-button [matMenuTriggerFor]="notificationMenu" class="relative">
                <div class="p-2 rounded-full" style="background-color: rgba(29, 174, 235, 0.1);">
                  <mat-icon style="color: #1DAEEB;">notifications</mat-icon>
                </div>
                <span *ngIf="getUnreadNotificationCount() > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {{ getUnreadNotificationCount() }}
                </span>
              </button>

              <!-- User Menu -->
              <button mat-icon-button [matMenuTriggerFor]="userMenu" class="relative">
                <div class="w-10 h-10 sidebar-gradient rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold text-sm">{{ getInitials(user.name) }}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        <!-- Dashboard Content -->
        <main class="flex-1 p-6 overflow-y-auto">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Marine Insurance Card -->
            <div class="dashboard-card bg-white p-6 rounded-2xl shadow-sm border-l-4" style="border-left-color: #1DAEEB;">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {{ user.role === 'intermediary' ? 'Client Marine Policies' : 'Marine Insurance' }}
                  </p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">{{ dashboardStats.marinePolicies }}</p>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ user.role === 'intermediary' ? 'Client policies' : 'Active policies' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Travel Insurance Card -->
            <div class="dashboard-card bg-white p-6 rounded-2xl shadow-sm border-l-4" style="border-left-color: #1DAEEB;">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {{ user.role === 'intermediary' ? 'Client Travel Policies' : 'Travel Insurance' }}
                  </p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">{{ dashboardStats.travelPolicies }}</p>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ user.role === 'intermediary' ? 'Client policies' : 'Active policies' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Pending Quotes Card -->
            <div class="dashboard-card bg-white p-6 rounded-2xl shadow-sm border-l-4" style="border-left-color: #1DAEEB;">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {{ user.role === 'intermediary' ? 'Active Quotes' : 'Pending Quotes' }}
                  </p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">{{ dashboardStats.pendingQuotes }}</p>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ user.role === 'intermediary' ? 'In progress' : 'Awaiting payment' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Total Premium/Client Count Card -->
            <div class="dashboard-card bg-white p-6 rounded-2xl shadow-sm border-l-4" style="border-left-color: #1DAEEB;">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <p class="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {{ user.role === 'intermediary' ? 'Total Clients' : 
                       user.role === 'corporate' ? 'Employees Covered' : 'Total Premium' }}
                  </p>
                  <p class="text-3xl font-bold text-gray-900 mt-2">
                    {{ (user.role === 'intermediary' || user.role === 'corporate') && dashboardStats.clientCount ? 
                       dashboardStats.clientCount : 
                       'KES ' + (dashboardStats.totalPremium | number:'1.0-0') }}
                  </p>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ user.role === 'intermediary' ? 'Active clients' : 
                       user.role === 'corporate' ? 'Covered employees' : 'Annual premium' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- MODIFICATION: Combined Main Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Main content (col-span-2) -->
            <div class="lg:col-span-2 space-y-8">
              
              <!-- Pending Quotes Section -->
              <div *ngIf="(user.role === 'individual' || user.role === 'corporate') && getPendingQuotes().length > 0">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Quotes Awaiting Payment</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div *ngFor="let quote of getPendingQuotes()" class="dashboard-card p-6 bg-white rounded-2xl">
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center space-x-2">
                        <span class="text-xs px-2 py-1 rounded-full capitalize" [ngClass]="getStatusColor(quote.status)">
                          {{ quote.status }}
                        </span>
                      </div>
                    </div>

                    <h4 class="font-semibold text-gray-900 mb-2">{{ quote.title }}</h4>
                    <p class="text-sm text-gray-600 mb-4">{{ quote.description }}</p>

                    <div class="flex justify-between items-center mb-4">
                      <div class="text-2xl font-bold text-gray-900">
                        KES {{ quote.amount | number:'1.0-0' }}
                      </div>
                      <div class="text-sm text-gray-500">
                        Expires: {{ quote.expiryDate | date : "shortDate" }}
                      </div>
                    </div>

                    <div class="flex space-x-2">
                      <button mat-button
                              (click)="editQuoteByType(quote.id, quote.type)"
                              class="sidebar-color-btn-outline flex-1 px-4 py-2 text-sm font-medium border-2 rounded-xl transition-all">
                        <mat-icon class="mr-2">edit</mat-icon>
                        Edit Quote
                      </button>
                      
                      <button mat-button
                              (click)="initiateMpesaPayment(quote.id)"
                              class="sidebar-color-btn flex-1 px-4 py-2 text-sm font-medium text-white rounded-xl transition-all"
                              *ngIf="quote.status === 'pending'">
                        <div class="flex items-center justify-center">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" 
                               alt="M-Pesa" 
                               class="w-4 h-3 object-contain mr-2" />
                          Pay via M-Pesa
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Active Policies -->
              <div class="bg-white rounded-2xl shadow-sm p-6">
                <div class="mb-6">
                  <h2 class="text-xl font-semibold text-gray-900 mb-2">
                    {{ user.role === 'intermediary' ? 'Recent Client Policies' : 'Active Policies' }}
                  </h2>
                </div>
                <div class="space-y-4">
                  <div *ngFor="let policy of activePolicies" 
                       class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                           [style.background-color]="policy.type === 'marine' ? 'rgba(29, 174, 235, 0.1)' : 'rgba(29, 174, 235, 0.1)'">
                        <mat-icon class="text-geminia-blue">
                          {{ policy.type === "marine" ? "directions_boat" : "flight" }}
                        </mat-icon>
                      </div>
                      <div>
                        <h4 class="font-medium text-gray-900">{{ policy.title }}</h4>
                        <p class="text-sm text-gray-500">{{ policy.policyNumber }}</p>
                        <p class="text-sm text-gray-500">KES {{ policy.premium | number:'1.0-0' }}/year</p>
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      <button mat-icon-button
                              (click)="downloadCertificate(policy.id)"
                              matTooltip="Download Certificate"
                              class="text-gray-500 hover:text-geminia-blue transition-colors">
                        <mat-icon>download</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Business Travel-Europe Card (for corporate users) -->
              <div class="bg-white rounded-2xl shadow-sm p-6" *ngIf="user.role === 'corporate'">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Business Travel - Europe</h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                        <mat-icon class="text-blue-600">flight</mat-icon>
                      </div>
                      <div>
                        <h4 class="font-medium text-gray-900">European Coverage Plan</h4>
                        <p class="text-sm text-gray-500">Active for all business trips</p>
                        <p class="text-sm text-gray-500">Coverage: €50,000 per trip</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="text-lg font-bold text-gray-900">25</span>
                      <p class="text-sm text-gray-500">Active trips</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Sidebar Actions (col-span-1) -->
            <div class="space-y-6">
              <!-- Quick Actions -->
              <div class="bg-white rounded-2xl shadow-sm p-6">
                <div class="mb-6">
                  <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div class="space-y-4">
                  <!-- Marine Quote Button -->
                  <button 
                    (click)="router.navigate(['/sign-up/marine-quote'])"
                    class="sidebar-color-btn w-full flex flex-col items-center p-4 rounded-2xl text-white transition-all"
                  >
                    <div class="bg-white-20 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                      <span class="font-bold text-lg">MQ</span>
                    </div>
                    <span class="font-medium">Marine Quote</span>
                  </button>
                  <!-- Travel Quote Button -->
                  <button 
                    (click)="router.navigate(['/sign-up/travel-quote'])"
                    class="sidebar-color-btn w-full flex flex-col items-center p-4 rounded-2xl text-white transition-all"
                  >
                    <div class="bg-white-20 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                      <span class="font-bold text-lg">TQ</span>
                    </div>
                    <span class="font-medium">Travel Quote</span>
                  </button>
                </div>
              </div>

              <!-- Recent Activity Section -->
              <div class="bg-white rounded-2xl shadow-sm p-6">
                <div class="mb-6">
                  <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div class="space-y-4 max-h-80 overflow-y-auto">
                  <div *ngFor="let activity of recentActivities" 
                       class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                       (click)="handleActivityClick(activity)">
                    <div class="flex-shrink-0">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center"
                           [style.background-color]="activity.iconColor + '20'"
                           [style.border]="'2px solid ' + activity.iconColor">
                        <mat-icon [style.color]="activity.iconColor" class="!text-sm">
                          {{ activity.icon }}
                        </mat-icon>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
                      <p class="text-xs text-gray-500 mt-1">{{ activity.description }}</p>
                      <div class="flex items-center justify-between mt-2">
                        <span class="text-xs text-gray-400">{{ activity.timestamp | date:'short' }}</span>
                        <span *ngIf="activity.amount" class="text-xs font-medium text-geminia-blue">
                          KES {{ activity.amount | number:'1.0-0' }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <!-- Empty state -->
                  <div *ngIf="recentActivities.length === 0" class="text-center py-8">
                    <mat-icon class="text-gray-300 !text-4xl mb-3">history</mat-icon>
                    <p class="text-gray-500 text-sm">No recent activity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Notification Menu -->
    <mat-menu #notificationMenu="matMenu">
      <button mat-menu-item *ngFor="let notification of notifications" (click)="markNotificationAsRead(notification)">
        <div class="flex items-start space-x-3 py-2">
          <div class="w-2 h-2 rounded-full mt-2" 
               [class]="notification.read ? 'bg-gray-300' : 'bg-red-500'">
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ notification.title }}</p>
            <p class="text-sm text-gray-600">{{ notification.message }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ notification.timestamp | date:'short' }}</p>
          </div>
        </div>
      </button>
    </mat-menu>

    <!-- User Menu -->
    <mat-menu #userMenu="matMenu">
      <button mat-menu-item (click)="router.navigate(['/profile'])">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </button>
      <button mat-menu-item (click)="router.navigate(['/settings'])">
        <mat-icon>settings</mat-icon>
        <span>Settings</span>
      </button>
      <button mat-menu-item (click)="router.navigate(['/mpesa-settings'])">
        <div class="flex items-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" 
               alt="M-Pesa" 
               class="w-5 h-3 object-contain mr-3" />
          <span>M-Pesa Settings</span>
        </div>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Logout</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    :host {
      --geminia-primary-color: #1DAEEB;
      --geminia-primary-dark: #1B9FD1;
      --sidebar-icon-blue: #4FC3F7; /* Brighter blue for sidebar icons */
    }

    .sidebar-gradient {
      background: linear-gradient(135deg, var(--geminia-primary-color) 0%, var(--geminia-primary-dark) 100%);
      position: relative;
    }
    .sidebar-gradient::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.03);
      pointer-events: none;
    }

    /* Updated sidebar navigation icon styles with brighter blue */
    .sidebar-nav-icon {
      color: var(--sidebar-icon-blue) !important;
      transition: all 0.3s ease;
    }

    .nav-menu-item:hover .sidebar-nav-icon {
      color: #81D4FA !important; /* Even brighter on hover */
      filter: drop-shadow(0 0 4px rgba(79, 195, 247, 0.3));
    }

    .nav-menu-item.active-menu-item .sidebar-nav-icon {
      color: #E1F5FE !important; /* Brightest for active state */
      filter: drop-shadow(0 0 6px rgba(225, 245, 254, 0.5));
    }

    .nav-menu-item.active-menu-item {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      font-weight: 600 !important;
    }
    
    .user-profile-section {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    .sidebar-color-btn {
      background: linear-gradient(135deg, var(--geminia-primary-color) 0%, var(--geminia-primary-dark) 100%);
      border: none;
      box-shadow: 0 4px 14px 0 rgba(29, 174, 235, 0.25);
      transition: all 0.3s ease;
    }
    .sidebar-color-btn:hover {
      background: linear-gradient(135deg, var(--geminia-primary-dark) 0%, #1A8FB8 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(29, 174, 235, 0.35);
    }
    .sidebar-color-btn:active {
      transform: translateY(0);
    }
    .sidebar-color-btn-outline {
      color: var(--geminia-primary-color);
      border-color: var(--geminia-primary-color);
      background: transparent;
    }
    .sidebar-color-btn-outline:hover {
      background-color: var(--geminia-primary-color);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(29, 174, 235, 0.25);
    }
    .dashboard-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    .dashboard-card:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      transform: translateY(-2px);
    }
    
    .nav-menu-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: white;
      border-radius: 0 2px 2px 0;
      transition: height 0.2s ease-in-out;
    }
    .nav-menu-item.active-menu-item::before,
    .nav-menu-item:hover::before {
      height: 24px;
    }
    
    ::ng-deep .success-snackbar {
      background-color: #10b981 !important;
      color: white !important;
    }

    ::ng-deep .mpesa-modal-panel .mat-mdc-dialog-container .mdc-dialog__surface {
        border-radius: 24px !important;
    }

    @media (max-width: 1024px) {
      .sidebar-gradient {
        position: fixed;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.3s ease-in-out;
      }
      .sidebar-gradient.mobile-open {
        transform: translateX(0);
      }
    }

    .role-indicator.individual { background-color: #10b981; }
    .role-indicator.corporate { background-color: #3b82f6; }
    .role-indicator.intermediary { background-color: #8b5cf6; }

    .text-white-70 { color: rgba(255, 255, 255, 0.7); }
    .text-white-80 { color: rgba(255, 255, 255, 0.8); }
    .bg-white-10 { background-color: rgba(255, 255, 255, 0.1); }
    .bg-white-20 { background-color: rgba(255, 255, 255, 0.2); }
    .border-white-20 { border-color: rgba(255, 255, 255, 0.2); }
    .hover\:text-geminia-blue:hover { color: var(--geminia-primary-color); }
    .text-geminia-blue { color: var(--geminia-primary-color); }
    .text-blue-600 { color: var(--geminia-primary-color) !important; }
    .bg-blue-100 { background-color: rgba(29, 174, 235, 0.1) !important; }

    /* Custom scrollbar for activity section */
    .max-h-80::-webkit-scrollbar {
      width: 4px;
    }
    .max-h-80::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 2px;
    }
    .max-h-80::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }
    .max-h-80::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  navigationItems: NavigationItem[] = [];
  
  user: User = {
    id: 'U001',
    name: 'Bonface Odhiambo',
    email: 'bonface@example.com',
    phoneNumber: '+254712345678',
    role: 'individual',
    lastLogin: new Date(),
    preferences: { currency: 'KES', language: 'en', notifications: true }
  };

  dashboardStats: DashboardStats = {
    marinePolicies: 0,
    travelPolicies: 0,
    pendingQuotes: 0,
    totalPremium: 0,
    clientCount: 0,
  };

  notifications: Notification[] = [
    { id: 'N001', title: 'Quote Expiry Reminder', message: 'Your travel insurance quote expires in 2 days', type: 'warning', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false, actionUrl: '/quotes/Q002' },
    { id: 'N002', title: 'Payment Received', message: 'M-Pesa payment of KES 2,500 received successfully', type: 'success', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), read: false },
    { id: 'N003', title: 'Policy Renewal', message: 'Marine policy renewal available', type: 'info', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), read: true }
  ];

  savedQuotes: Quote[] = [
    { id: 'Q001', type: 'marine', title: 'Cargo Insurance - Electronics', amount: 15000, status: 'draft', createdDate: new Date('2025-06-25'), expiryDate: new Date('2025-07-25'), description: 'Marine cargo insurance for electronics shipment', progress: 65 },
    { id: 'Q002', type: 'travel', title: 'Business Travel - Europe', amount: 2500, status: 'pending', createdDate: new Date('2025-06-20'), expiryDate: new Date('2025-07-20'), description: 'Travel insurance for business trip to Europe', progress: 90 }
  ];

  activePolicies: Policy[] = [
    { id: 'P001', type: 'marine', title: 'Marine Cargo Policy', policyNumber: 'MAR-2025-001', status: 'active', premium: 12000, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), certificateUrl: '/certificates/MAR-2025-001.pdf', renewalDate: new Date('2025-11-01') }
  ];

  recentActivities: Activity[] = [];
  isMobileSidebarOpen = false;
  isLoading = false;

  constructor(
    private dialog: MatDialog, 
    public router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadDashboardData();
    this.setupNavigationBasedOnRole();
    this.loadRecentActivities();

    // Mark notifications as read after a delay for demonstration
    setTimeout(() => {
        this.notifications.forEach(n => n.read = true);
    }, 5000);

    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (window.innerWidth >= 1024) {
      this.isMobileSidebarOpen = false;
    }
  }

  private loadRecentActivities(): void {
    // Initial static activities
    const baseActivities: Activity[] = [
      { id: 'A001', type: 'policy_downloaded', title: 'Policy Certificate Downloaded', description: 'Marine Cargo Policy MAR-2025-001 certificate downloaded', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), icon: 'download', iconColor: '#10b981', relatedId: 'P001' },
      { id: 'A002', type: 'payment_made', title: 'Payment Successful', description: 'M-Pesa payment for travel insurance completed', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), icon: 'payment', iconColor: '#1DAEEB', amount: 2500, relatedId: 'Q002' },
      { id: 'A003', type: 'quote_created', title: 'New Quote Generated', description: 'Marine cargo insurance quote created', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), icon: 'description', iconColor: '#f59e0b', amount: 15000, relatedId: 'Q001' },
      { id: 'A004', type: 'profile_updated', title: 'Profile Updated', description: 'Contact information and preferences updated', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), icon: 'person', iconColor: '#8b5cf6' },
      { id: 'A005', type: 'quote_paid', title: 'Quote Payment Received', description: 'Business travel insurance quote payment processed', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: 'check_circle', iconColor: '#10b981', amount: 2500, relatedId: 'Q002' }
    ];

    this.recentActivities = [...baseActivities];

    // Add role-specific activities for demonstration
    if (this.user.role === 'corporate') {
      this.recentActivities.unshift({ id: 'A006', type: 'policy_renewed', title: 'Employee Coverage Renewed', description: 'Annual corporate travel policy renewed', timestamp: new Date(Date.now() - 30 * 60 * 1000), icon: 'refresh', iconColor: '#1DAEEB', amount: 125000 });
    } else if (this.user.role === 'intermediary') {
      this.recentActivities.unshift({ id: 'A007', type: 'claim_submitted', title: 'Client Claim Processed', description: 'Marine cargo claim submitted for client', timestamp: new Date(Date.now() - 45 * 60 * 1000), icon: 'assignment', iconColor: '#ef4444', amount: 50000 });
    }

    this.recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  handleActivityClick(activity: Activity): void {
    switch (activity.type) {
      case 'policy_downloaded':
        if (activity.relatedId) this.downloadCertificate(activity.relatedId);
        break;
      case 'quote_created':
      case 'quote_paid':
        const quote = this.savedQuotes.find(q => q.id === activity.relatedId);
        if (quote) this.editQuoteByType(quote.id, quote.type);
        break;
      case 'payment_made': this.router.navigate(['/payment-history']); break;
      case 'profile_updated': this.router.navigate(['/profile']); break;
      case 'policy_renewed': this.router.navigate(['/policies']); break;
      case 'claim_submitted': this.router.navigate(['/claims']); break;
    }
  }

  private addActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
    const newActivity: Activity = {
      ...activity,
      id: 'A' + (this.recentActivities.length + 1).toString().padStart(3, '0'),
      timestamp: new Date()
    };
    this.recentActivities.unshift(newActivity);
    this.recentActivities = this.recentActivities.slice(0, 10);
  }

  getInitials(name: string): string {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  getRoleDisplayName(): string {
    const roleNames = { individual: 'Individual Client', corporate: 'Corporate Client', intermediary: 'Insurance Intermediary' };
    return roleNames[this.user.role];
  }

  getRoleColor(): string {
    const roleColors = { individual: 'role-indicator individual', corporate: 'role-indicator corporate', intermediary: 'role-indicator intermediary' };
    return roleColors[this.user.role];
  }

  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleNavItem(item: NavigationItem): void {
    if (item.children) item.isExpanded = !item.isExpanded;
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  getPendingQuotes(): Quote[] {
    return this.savedQuotes.filter(quote => quote.status === 'draft' || quote.status === 'pending');
  }

  // DEBUG: This method was corrected. The duplicated, nested code block was removed.
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.draft;
  }

  editQuoteByType(quoteId: string, type: 'marine' | 'travel'): void {
    const routes = { marine: '/sign-up/marine-quote', travel: '/sign-up/travel-quote' };
    this.router.navigate([routes[type]], { queryParams: { editId: quoteId } });
  }

  initiateMpesaPayment(quoteId: string): void {
    const quote = this.savedQuotes.find(q => q.id === quoteId);
    if (quote) {
      this.openMpesaModal({ amount: quote.amount, phoneNumber: this.user.phoneNumber, reference: quote.id, description: quote.title });
    }
  }

  private openMpesaModal(paymentData: MpesaPayment): void {
    const dialogRef = this.dialog.open(MpesaPaymentModalComponent, {
      width: 'auto',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: paymentData,
      panelClass: 'mpesa-modal-panel',
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && result.success) {
        this.handlePaymentSuccess(result);
      }
    });
  }

  private handlePaymentSuccess(result: { reference: string }): void {
    const quote = this.savedQuotes.find(q => q.id === result.reference);
    if (quote) {
      quote.status = 'completed';
      this.loadDashboardData();
      this.snackBar.open(`Payment of KES ${quote.amount.toLocaleString()} for "${quote.title}" received!`, 'OK', { duration: 5000, panelClass: 'success-snackbar' });
      
      this.addActivity({
        type: 'payment_made',
        title: 'Payment Successful',
        description: `M-Pesa payment for ${quote.title} completed`,
        icon: 'payment',
        iconColor: '#1DAEEB',
        amount: quote.amount,
        relatedId: quote.id
      });
    }
  }

  downloadCertificate(policyId: string): void {
    const policy = this.activePolicies.find(p => p.id === policyId);
    if (policy?.certificateUrl) {
      this.snackBar.open(`Downloading certificate for ${policy.title}...`, 'Close', { duration: 3000 });
      window.open(policy.certificateUrl, '_blank');
      
      this.addActivity({
        type: 'policy_downloaded',
        title: 'Policy Certificate Downloaded',
        description: `${policy.title} certificate downloaded`,
        icon: 'download',
        iconColor: '#10b981',
        relatedId: policy.id
      });
    }
  }

  markNotificationAsRead(notification: Notification): void {
    notification.read = true;
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  setupNavigationBasedOnRole(): void {
    const baseNavigation: NavigationItem[] = [{ label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }];
    const quoteCount = this.getPendingQuotes().length;

    const roleSpecificNavigation: { [key in UserRole]: NavigationItem[] } = {
      individual: [
        { label: 'My Quotes', icon: 'description', isExpanded: quoteCount > 0, badge: quoteCount, children: [
          { label: 'Drafts & Pending', icon: 'pending_actions', route: '/quotes/pending' }, 
          { label: 'Completed', icon: 'check_circle', route: '/quotes/completed' }
        ]},
        { label: 'Marine Insurance', icon: 'directions_boat', children: [{ label: 'Active Policies', icon: 'shield', route: '/marine-policies' }, { label: 'New Quote', icon: 'add_circle', route: '/sign-up/marine-quote' }] },
        { label: 'Travel Insurance', icon: 'flight', children: [{ label: 'Active Policies', icon: 'shield', route: '/travel-policies' }, { label: 'New Quote', icon: 'add_circle', route: '/sign-up/travel-quote' }] }
      ],
      corporate: [
        { label: 'Company Overview', icon: 'business', isExpanded: true, children: [{ label: 'All Policies', icon: 'shield', route: '/corporate-policies' }, { label: 'Employee Coverage', icon: 'group', route: '/employee-coverage' }] },
        { label: 'Fleet Management', icon: 'local_shipping', children: [{ label: 'Marine Fleet', icon: 'directions_boat', route: '/marine-fleet' }] }
      ],
      intermediary: [
        { label: 'Client Management', icon: 'people', isExpanded: true, children: [{ label: 'All Clients', icon: 'list', route: '/clients' }, { label: 'Add Client', icon: 'person_add', route: '/add-client' }] },
        { label: 'Commission', icon: 'account_balance_wallet', children: [{ label: 'Monthly Reports', icon: 'assessment', route: '/commission-reports' }] }
      ]
    };
    this.navigationItems = [ ...baseNavigation, ...roleSpecificNavigation[this.user.role] ];
  }

  loadDashboardData(): void {
    switch (this.user.role) {
      case 'individual': this.loadIndividualData(); break;
      case 'corporate': this.loadCorporateData(); break;
      case 'intermediary': this.loadIntermediaryData(); break;
    }
  }

  private loadIndividualData(): void {
    this.dashboardStats = { 
      marinePolicies: this.activePolicies.filter(p => p.type === 'marine').length, 
      travelPolicies: this.activePolicies.filter(p => p.type === 'travel').length, 
      pendingQuotes: this.getPendingQuotes().length, 
      totalPremium: this.activePolicies.reduce((sum, p) => sum + p.premium, 0),
    };
  }

  private loadCorporateData(): void {
    this.dashboardStats = { 
      marinePolicies: 15, travelPolicies: 8, pendingQuotes: 3, totalPremium: 450000, clientCount: 250
    };
  }

  private loadIntermediaryData(): void {
    this.dashboardStats = { 
      marinePolicies: 85, travelPolicies: 42, pendingQuotes: 12, totalPremium: 2850000, clientCount: 124 
    };
  }

  logout(): void {
    // A simple confirmation dialog before logging out
    if (confirm('Are you sure you want to logout?')) {
      this.router.navigate(['/sign-in']);
    }
  }
}