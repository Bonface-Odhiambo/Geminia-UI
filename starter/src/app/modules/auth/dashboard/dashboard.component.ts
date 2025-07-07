// =========================================================================================
// This is the full, corrected code. Copy and paste this into your project file.
// =========================================================================================

import { CommonModule } from '@angular/common';
import {
    Component,
    HostListener,
    Inject,
    OnDestroy,
    OnInit,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// --- TYPE DEFINITIONS (Unchanged) ---
type UserRole = 'individual' | 'corporate' | 'intermediary';
interface User { id: string; name: string; email: string; phoneNumber: string; role: UserRole; companyName?: string; intermediaryCode?: string; avatar?: string; lastLogin?: Date; preferences?: { currency: string; language: string; notifications: boolean; }; }
interface Quote { id: string; type: 'marine' | 'travel'; title: string; amount: number; status: 'draft' | 'pending' | 'completed' | 'expired'; createdDate: Date; expiryDate: Date; description: string; clientId?: string; progress?: number; }
interface Policy { id: string; type: 'marine' | 'travel'; title: string; policyNumber: string; status: 'active' | 'expired' | 'cancelled' | 'completed'; premium: number; startDate: Date; endDate: Date; certificateUrl?: string; policyStatementUrl?: string; clientId?: string; renewalDate?: Date; transactionDetails: { refNo: string; idfNumber?: string; importerPin?: string; client: string; transactionDate: Date; clearingAgent?: string; intermediary?: string; consignmentNumber?: string; shippingMode?: string; countryOfOrigin?: string; countryOfDestination?: string; vesselName?: string; portOfOrigin?: string; portOfDestination?: string; arrivalDate?: Date; sumInsured: number; trainingLevy?: number; phcf?: number; stampDuty?: number; netPremium: number; vesselNumber?: string; voyageNumber?: string; premiumRate?: number; paid?: boolean; totalPaidAmount?: number; financierPin?: string; countyName?: string; transhippingAt?: string; }; cargoDetails?: { category: string; cargoType: string; packagingType: string; amountToPay: number; }; }
interface DashboardStats { marinePolicies: number; travelPolicies: number; pendingQuotes: number; totalPremium: number; clientCount?: number; monthlyGrowth?: number; renewalsThisMonth?: number; }
interface MpesaPayment { amount: number; phoneNumber: string; reference: string; description: string; }
interface NavigationItem { label: string; icon: string; route?: string; action?: () => void; children?: NavigationItem[]; roles?: UserRole[]; badge?: number; isExpanded?: boolean; }
interface Notification { id: string; title: string; message: string; type: 'info' | 'warning' | 'success' | 'error'; timestamp: Date; read: boolean; actionUrl?: string; }
interface Activity { id: string; type: | 'quote_created' | 'quote_paid' | 'policy_downloaded' | 'payment_made' | 'policy_renewed' | 'claim_submitted' | 'profile_updated'; title: string; description: string; timestamp: Date; icon: string; iconColor: string; amount?: number; relatedId?: string; }

// --- MPESA PAYMENT MODAL COMPONENT (Unchanged from previous version) ---
@Component({
    selector: 'app-mpesa-payment-modal',
    standalone: true,
    imports: [ CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatProgressSpinnerModule, ],
    template: `
        <div class="mpesa-modal-container">
            <div class="modal-header">
                <div class="header-content">
                    <div class="brand-text">
                        <h1 class="modal-title">{{ paymentSuccessful ? 'Payment Successful' : 'Complete Your Payment' }}</h1>
                        <p class="modal-subtitle">KES {{ data.amount | number: '1.2-2' }} for {{ data.description }}</p>
                    </div>
                    <button mat-icon-button [mat-dialog-close]="dialogCloseResult" class="close-button" [disabled]="isProcessing"><mat-icon>close</mat-icon></button>
                </div>
            </div>
            <div class="modal-body">
                <ng-container *ngIf="!paymentSuccessful">
                    <div class="payment-tabs">
                        <button (click)="selectPaymentMethod('mpesa')" class="tab-button" [class.active]="selectedPaymentMethod === 'mpesa'"><img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-PESA" class="tab-icon"/><span>M-PESA</span></button>
                        <button (click)="selectPaymentMethod('card')" class="tab-button" [class.active]="selectedPaymentMethod === 'card'"><mat-icon class="tab-icon">credit_card</mat-icon><span>Card</span></button>
                    </div>
                    <div *ngIf="selectedPaymentMethod === 'mpesa'">
                        <ng-container *ngIf="!stkPushFailed">
                            <form [formGroup]="paymentForm" class="payment-form">
                                <mat-form-field appearance="outline"><mat-label>M-PESA Phone Number</mat-label><input matInput placeholder="+254712345678" formControlName="phoneNumber" [disabled]="isProcessing" type="tel"/><mat-icon matSuffix>smartphone</mat-icon></mat-form-field>
                            </form>
                            <button mat-raised-button (click)="initiateMpesaPayment()" [disabled]="paymentForm.invalid || isProcessing" class="pay-button mpesa-button"><span *ngIf="!isProcessing">Pay KES {{ data.amount | number: '1.0-0' }}</span><span *ngIf="isProcessing">Processing...</span></button>
                        </ng-container>
                        <div *ngIf="stkPushFailed" class="stk-failure-section">
                            <div class="failure-icon-wrapper"><mat-icon>error_outline</mat-icon></div>
                            <h3 class="failure-title">STK Push Failed</h3>
                            <p class="failure-message">Please use the details below to pay manually via the M-PESA menu.</p>
                            <div class="paybill-details"><div class="detail-item"><span class="label">Paybill Number:</span><span class="value">123456</span></div><div class="detail-item"><span class="label">Account Number:</span><span class="value">{{ data.reference }}</span></div></div>
                            <button mat-stroked-button [mat-dialog-close]="{ manualPay: true }" class="manual-pay-button">I will pay manually</button>
                        </div>
                    </div>
                    <div *ngIf="selectedPaymentMethod === 'card'">
                        <form [formGroup]="cardForm" class="payment-form">
                            <mat-form-field appearance="outline"><mat-label>Card Number</mat-label><input matInput placeholder="0000 0000 0000 0000" formControlName="cardNumber" maxlength="16" /><mat-icon matSuffix>credit_card</mat-icon></mat-form-field>
                            <div class="form-row"><mat-form-field appearance="outline"><mat-label>Expiry (MM/YY)</mat-label><input matInput placeholder="MM/YY" formControlName="expiryDate"/></mat-form-field><mat-form-field appearance="outline"><mat-label>CVC</mat-label><input matInput placeholder="123" formControlName="cvc" maxlength="4"/></mat-form-field></div>
                        </form>
                        <button mat-raised-button (click)="processCardPayment()" [disabled]="cardForm.invalid || isProcessing" class="pay-button card-button"><span *ngIf="!isProcessing">Pay KES {{ data.amount | number: '1.0-0' }}</span><span *ngIf="isProcessing">Processing...</span></button>
                    </div>
                    <div class="processing-overlay" *ngIf="isProcessing"><mat-progress-spinner diameter="50" mode="indeterminate"></mat-progress-spinner><p>{{ selectedPaymentMethod === 'mpesa' ? 'Sending prompt to your phone...' : 'Securing your transaction...' }}</p></div>
                </ng-container>
                <ng-container *ngIf="paymentSuccessful">
                    <div class="success-container"><div class="success-icon-wrapper"><mat-icon class="success-icon">check_circle</mat-icon></div><h2 class="success-title">Payment Confirmed</h2><div class="reference-details"><div class="reference-item"><span class="reference-label">Transaction No.</span><span class="reference-value mpesa-code">{{ mpesaReceiptNumber }}</span></div></div><button mat-raised-button [mat-dialog-close]="dialogCloseResult" class="done-button">Done</button></div>
                </ng-container>
            </div>
        </div>
    `,
    styles: [`:host{--primary-color:#1daeeb;--primary-dark:#1b9fd1;--success-color:#22c55e;--error-color:#f43f5e;--text-primary:#1f2937;--text-secondary:#6b7280;--background:#fff;--surface:#f8fafc;--border:#e2e8f0}.mpesa-modal-container{max-width:420px;border-radius:16px;box-shadow:0 10px 25px -5px rgba(0,0,0,.1);overflow:hidden}.modal-header{background:var(--primary-color);padding:24px;color:#fff}.header-content{display:flex;justify-content:space-between}.modal-title{font-size:20px;font-weight:700}.modal-subtitle{font-size:14px;opacity:.9}.close-button{color:#fff}.modal-body{padding:24px;position:relative}.payment-tabs{display:flex;gap:8px;background-color:var(--surface);border-radius:12px;padding:6px;margin-bottom:24px}.tab-button{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:none;background-color:transparent;border-radius:8px;cursor:pointer;font-weight:600;color:var(--text-secondary);transition:all .2s ease-in-out}.tab-button.active{background-color:var(--background);color:var(--text-primary);box-shadow:0 1px 3px rgba(0,0,0,.05)}.tab-icon{height:20px}.payment-form{display:flex;flex-direction:column;gap:16px}.form-row{display:flex;gap:16px}.pay-button{width:100%;height:48px;border-radius:12px;font-size:16px;font-weight:700;margin-top:16px;color:#fff}.mpesa-button,.card-button{background-color:var(--primary-color)}.mpesa-button:hover{background-color:var(--primary-dark)}.stk-failure-section{text-align:center;padding:16px 0}.failure-icon-wrapper{color:var(--error-color)}.failure-icon-wrapper .mat-icon{font-size:48px;width:48px;height:48px}.failure-title{font-size:18px;font-weight:700;margin:16px 0 8px}.failure-message{color:var(--text-secondary);font-size:14px;margin-bottom:24px}.paybill-details{background:var(--surface);border:1px dashed var(--border);border-radius:12px;padding:16px;margin-bottom:24px}.detail-item{display:flex;justify-content:space-between;padding:8px 0}.detail-item+.detail-item{border-top:1px solid var(--border)}.processing-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.85);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:10}.success-container{display:flex;flex-direction:column;align-items:center;padding:16px 0}.success-icon-wrapper{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;background-color:color-mix(in srgb,var(--success-color) 15%,transparent);margin-bottom:20px}.success-icon{font-size:48px;color:var(--success-color)}.success-title{font-size:24px;font-weight:700;margin:0 0 8px}.reference-details{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:24px}.reference-value.mpesa-code{font-family:'Courier New',Courier,monospace;background-color:var(--border);padding:4px 8px;border-radius:6px}.done-button{width:100%;height:48px;border-radius:12px;background:var(--success-color);color:#fff;font-weight:600;font-size:16px}`],
})
export class MpesaPaymentModalComponent implements OnInit {
    paymentForm: FormGroup; cardForm: FormGroup; isProcessing = false; paymentSuccessful = false; mpesaReceiptNumber: string | null = null; selectedPaymentMethod: 'mpesa' | 'card' = 'mpesa'; stkPushFailed = false;
    constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<MpesaPaymentModalComponent>, @Inject(MAT_DIALOG_DATA) public data: MpesaPayment) { this.paymentForm = this.fb.group({ phoneNumber: [data.phoneNumber || '', [Validators.required, Validators.pattern(/^\+254[0-9]{9}$/)]] }); this.cardForm = this.fb.group({ cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]], expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]], cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]] }); }
    ngOnInit(): void {}
    selectPaymentMethod(method: 'mpesa' | 'card') { this.selectedPaymentMethod = method; this.stkPushFailed = false; }
    get dialogCloseResult(): any { if (this.paymentSuccessful) { return { success: true, reference: this.data.reference, mpesaReceipt: this.mpesaReceiptNumber }; } return null; }
    initiateMpesaPayment(): void { if (this.paymentForm.invalid) return; this.isProcessing = true; this.stkPushFailed = false; setTimeout(() => { const success = Math.random() > 0.5; this.isProcessing = false; if (success) { this.mpesaReceiptNumber = 'S' + Math.random().toString(36).substring(2, 12).toUpperCase(); this.paymentSuccessful = true; } else { this.stkPushFailed = true; } }, 3000); }
    processCardPayment(): void { if (this.cardForm.invalid) return; this.isProcessing = true; setTimeout(() => { this.isProcessing = false; this.mpesaReceiptNumber = 'CARD_TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase(); this.paymentSuccessful = true; }, 2500); }
}


// --- DASHBOARD COMPONENT (TEMPLATE & STYLES UPDATED) ---

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [ CommonModule, RouterModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatChipsModule, MatCardModule, MatDialogModule, MatBadgeModule, MatSnackBarModule, ],
    template: `
        <div class="flex min-h-screen w-screen bg-gray-50">
            <!-- Sidebar -->
            <div class="sidebar-gradient flex w-64 flex-col text-white" [class.mobile-open]="isMobileSidebarOpen">
                <!-- Sidebar content unchanged -->
                <div class="border-white-20 border-b p-6"><div class="flex items-center space-x-3"><div class="flex h-20 w-20 items-center justify-center"><img src="https://geminialife.co.ke/wp-content/uploads/2022/06/thumbnail_GEMINIA-FINAL-LOGO-png.png" alt="Geminia Insurance Logo" class="h-full w-full object-contain"/></div><div><h1 class="text-lg font-bold">GEMINIA</h1><p class="text-white-80 text-xs">INSURANCE</p><p class="text-white-70 text-xs">{{ getRoleDisplayName() }}</p></div></div></div>
                <div class="border-white-20 user-profile-section border-b p-6"><div class="flex items-center space-x-3"><div class="relative"><div class="bg-white-20 flex h-12 w-12 items-center justify-center rounded-full"><span class="text-lg font-semibold text-white">{{ getInitials(user.name) }}</span></div><div class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full {{ getRoleColor() }} border-2 border-white"></div></div><div class="flex-1"><h3 class="font-medium text-white">Welcome, {{ user.name.split(' ')[1] }}</h3><h2 class="font-bold text-white">{{ user.name.split(' ')[0] }}</h2></div></div></div>
                <nav class="flex-1 p-4"><div class="space-y-2"><ng-container *ngFor="let item of navigationItems"><a *ngIf="!item.children && item.route" [routerLink]="item.route" routerLinkActive="active-menu-item" class="nav-menu-item text-white-80 hover:bg-white-10 flex items-center space-x-3 rounded-lg px-4 py-3 transition-all hover:text-white"><mat-icon class="sidebar-nav-icon">{{ item.icon }}</mat-icon><span>{{ item.label }}</span></a><div *ngIf="item.children" class="space-y-1"><button (click)="toggleNavItem(item)" class="nav-menu-item text-white-80 hover:bg-white-10 flex w-full items-center justify-between rounded-lg px-4 py-3 transition-all hover:text-white"><div class="flex items-center space-x-3"><mat-icon class="sidebar-nav-icon">{{ item.icon }}</mat-icon><span>{{ item.label }}</span><span *ngIf="item.badge && item.badge > 0" class="rounded-full bg-red-500 px-2 py-1 text-xs text-white">{{ item.badge }}</span></div><mat-icon class="sidebar-nav-icon" [class.rotate-180]="item.isExpanded" class="transition-transform">expand_more</mat-icon></button><div *ngIf="item.isExpanded" class="ml-6 space-y-1"><ng-container *ngFor="let child of item.children"><a *ngIf="child.route" [routerLink]="child.route" class="text-white-70 hover:bg-white-10 block w-full rounded-lg px-4 py-2 text-left text-sm transition-colors hover:text-white"><div class="flex items-center space-x-2"><mat-icon class="sidebar-nav-icon !text-sm">{{ child.icon }}</mat-icon><span>{{ child.label }}</span></div></a></ng-container></div></div></ng-container></div></nav>
            </div>

            <!-- Main Content -->
            <div class="flex flex-1 flex-col">
                <header class="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
                    <!-- Header content unchanged -->
                    <div class="flex items-center justify-between"><div class="flex items-center space-x-4"><button mat-icon-button (click)="toggleMobileSidebar()" class="lg:hidden"><mat-icon>menu</mat-icon></button><div class="flex items-center space-x-3"><div><h2 class="text-2xl font-bold text-gray-900">Dashboard</h2></div></div></div><div class="flex items-center space-x-4"><button mat-icon-button [matMenuTriggerFor]="notificationMenu" class="relative"><div class="rounded-full p-2" style="background-color: rgba(29, 174, 235, 0.1);"><mat-icon style="color: #1DAEEB;">notifications</mat-icon></div><span *ngIf="getUnreadNotificationCount() > 0" class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{{ getUnreadNotificationCount() }}</span></button><button mat-icon-button [matMenuTriggerFor]="userMenu" class="relative"><div class="sidebar-gradient flex h-10 w-10 items-center justify-center rounded-full"><span class="text-sm font-semibold text-white">{{ getInitials(user.name) }}</span></div></button></div></div>
                </header>

                <main class="flex-1 overflow-y-auto p-6">
                    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <!-- Stats cards unchanged -->
                        <div class="dashboard-card rounded-2xl border-l-4 bg-white p-6 shadow-sm" style="border-left-color: #1daeeb"><p class="text-sm font-medium uppercase tracking-wide text-gray-600">Marine Insurance</p><p class="mt-2 text-3xl font-bold text-gray-900">{{ dashboardStats.marinePolicies }}</p></div>
                        <div class="dashboard-card rounded-2xl border-l-4 bg-white p-6 shadow-sm" style="border-left-color: #1daeeb"><p class="text-sm font-medium uppercase tracking-wide text-gray-600">Travel Insurance</p><p class="mt-2 text-3xl font-bold text-gray-900">{{ dashboardStats.travelPolicies }}</p></div>
                        <div class="dashboard-card rounded-2xl border-l-4 bg-white p-6 shadow-sm" style="border-left-color: #1daeeb"><p class="text-sm font-medium uppercase tracking-wide text-gray-600">Pending Quotes</p><p class="mt-2 text-3xl font-bold text-gray-900">{{ dashboardStats.pendingQuotes }}</p></div>
                        <div class="dashboard-card rounded-2xl border-l-4 bg-white p-6 shadow-sm" style="border-left-color: #1daeeb"><p class="text-sm font-medium uppercase tracking-wide text-gray-600">Total Premium</p><p class="mt-2 text-3xl font-bold text-gray-900">KES {{ dashboardStats.totalPremium | number: '1.0-0' }}</p></div>
                    </div>

                    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div class="space-y-8 lg:col-span-2">
                            <!-- Pending Quotes Section -->
                            <div *ngIf="getPendingQuotes().length > 0" id="pending-quotes">
                                <h3 class="mb-4 text-lg font-semibold text-gray-900">Quotes Awaiting Payment</h3>
                                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div *ngFor="let quote of getPendingQuotes()" class="dashboard-card rounded-2xl bg-white p-6">
                                        <h4 class="mb-2 font-semibold text-gray-900">{{ quote.title }}</h4>
                                        <p class="mb-4 text-sm text-gray-600">{{ quote.description }}</p>
                                        <div class="mb-4 flex items-center justify-between"><div class="text-2xl font-bold text-gray-900">KES {{ quote.amount | number: '1.0-0' }}</div><div class="text-sm text-gray-500">Expires: {{ quote.expiryDate | date: 'shortDate' }}</div></div>
                                        
                                        <!-- MODIFICATION: Button styles updated here -->
                                        <div class="flex space-x-2">
                                            <button mat-raised-button (click)="editQuoteByType(quote.id, quote.type)" class="sidebar-color-btn-secondary flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all">
                                                <mat-icon class="mr-2">edit</mat-icon>
                                                Edit
                                            </button>
                                            <button mat-raised-button (click)="initiateMpesaPayment(quote.id)" class="sidebar-color-btn flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all">
                                                <mat-icon>payment</mat-icon>
                                                Pay Now
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <!-- Active Policies Section -->
                            <div class="rounded-2xl bg-white p-6 shadow-sm" id="active-policies">
                                <h2 class="text-xl font-semibold text-gray-900 mb-6">Active Policies</h2>
                                <div class="space-y-3">
                                    <div *ngFor="let policy of activePolicies" class="policy-card overflow-hidden rounded-lg border border-gray-200">
                                        <div class="flex cursor-pointer items-center justify-between bg-gray-50/50 p-4 hover:bg-gray-100" (click)="togglePolicyDetails(policy.id)">
                                            <div class="flex flex-1 items-center space-x-4"><mat-icon class="text-geminia-blue">{{ policy.type === 'marine' ? 'directions_boat' : 'flight' }}</mat-icon><p class="truncate font-semibold text-gray-900">{{ policy.title }}</p></div>
                                            <button mat-icon-button class="transition-transform duration-300" [class.rotate-180]="expandedPolicyId === policy.id"><mat-icon>expand_more</mat-icon></button>
                                        </div>
                                        <div class="policy-details-collapsible" [class.expanded]="expandedPolicyId === policy.id">
                                            <div class="bg-white p-6"><p>Policy #{{ policy.policyNumber }}</p><p>Premium: KES {{ policy.premium | number: '1.2-2' }}</p></div>
                                            <div class="flex items-center justify-end rounded-b-lg border-t bg-gray-50 p-4">
                                                
                                                <!-- MODIFICATION: This button is already correctly styled -->
                                                <button mat-raised-button (click)="downloadCertificate(policy.id)" class="sidebar-color-btn rounded-lg px-4 py-2 text-sm font-medium text-white">
                                                    <mat-icon class="mr-2">download</mat-icon>
                                                    Download Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column -->
                        <div class="space-y-6">
                            <div class="rounded-2xl bg-white p-6 shadow-sm"><h2 class="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2><div class="space-y-4"><button (click)="router.navigate(['/sign-up/marine-quote'])" class="sidebar-color-btn w-full rounded-xl p-4 text-white">New Marine Quote</button><button (click)="router.navigate(['/sign-up/travel-quote'])" class="sidebar-color-btn w-full rounded-xl p-4 text-white">New Travel Quote</button></div></div>
                            <div class="rounded-2xl bg-white p-6 shadow-sm"><h2 class="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2><div class="max-h-80 space-y-4 overflow-y-auto"><div *ngFor="let activity of recentActivities" class="flex cursor-pointer items-start space-x-3 rounded-lg p-3 hover:bg-gray-50" (click)="handleActivityClick(activity)"><div class="flex h-8 w-8 items-center justify-center rounded-full" [style.background-color]="activity.iconColor + '20'"><mat-icon [style.color]="activity.iconColor" class="!text-base">{{ activity.icon }}</mat-icon></div><div><p class="text-sm font-medium text-gray-900">{{ activity.title }}</p><p class="text-xs text-gray-500">{{ activity.timestamp | date: 'short' }}</p></div></div></div></div>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <!-- Menus -->
        <mat-menu #notificationMenu="matMenu"><button mat-menu-item *ngFor="let notification of notifications" (click)="markNotificationAsRead(notification)" class="!min-w-[320px]"><div class="flex items-start space-x-3 py-2"><div class="mt-1 h-2 w-2 rounded-full" [class]="notification.read ? 'bg-gray-300' : 'bg-red-500'"></div><div><p class="font-medium text-gray-900">{{ notification.title }}</p><p class="whitespace-normal text-sm text-gray-600">{{ notification.message }}</p></div></div></button></mat-menu>
        <mat-menu #userMenu="matMenu"><button mat-menu-item (click)="router.navigate(['/profile'])"><mat-icon>person</mat-icon><span>Profile</span></button><mat-divider></mat-divider><button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Logout</span></button></mat-menu>
    `,
    styles: [
        `
            :host {
                --geminia-primary-color: #1daeeb;
                --geminia-primary-dark: #1b9fd1;
            }
            .sidebar-gradient {
                background: linear-gradient(
                    135deg,
                    var(--geminia-primary-color) 0%,
                    var(--geminia-primary-dark) 100%
                );
            }
            /* Primary solid blue button */
            .sidebar-color-btn {
                background-color: var(--geminia-primary-color);
                color: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .sidebar-color-btn:hover {
                background-color: var(--geminia-primary-dark);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            /* MODIFICATION: New style for secondary blue buttons */
            .sidebar-color-btn-secondary {
                background-color: rgba(29, 174, 235, 0.15); /* Light blue background */
                color: var(--geminia-primary-color); /* Dark blue text */
                box-shadow: none !important;
            }
            .sidebar-color-btn-secondary:hover {
                background-color: rgba(29, 174, 235, 0.25); /* A bit darker on hover */
            }

            .dashboard-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            .policy-details-collapsible {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.4s ease-out;
            }
            .policy-details-collapsible.expanded {
                max-height: 1500px;
                transition: max-height 0.5s ease-in;
            }
            .text-geminia-blue { color: var(--geminia-primary-color); }
            .max-h-80::-webkit-scrollbar { width: 4px; }
            .max-h-80::-webkit-scrollbar-track { background: #f1f5f9; }
            .max-h-80::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
            ::ng-deep .mpesa-modal-panel .mat-mdc-dialog-container .mdc-dialog__surface { border-radius: 16px !important; padding: 0 !important; }
        `,
    ],
})
export class DashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    navigationItems: NavigationItem[] = [];
    user: User = { id: 'U001', name: 'Bonface Odhiambo', email: 'bonface@example.com', phoneNumber: '+254712345678', role: 'individual' };
    dashboardStats: DashboardStats = { marinePolicies: 0, travelPolicies: 0, pendingQuotes: 0, totalPremium: 0 };
    notifications: Notification[] = [ { id: 'N001', title: 'Quotes Awaiting Payment', message: 'You have quotes that need payment to activate your policy.', type: 'warning', timestamp: new Date(), read: false, actionUrl: '#pending-quotes' }, { id: 'N002', title: 'Certificates Ready', message: 'Your new policy certificates are ready for download.', type: 'success', timestamp: new Date(), read: false, actionUrl: '#active-policies' } ];
    savedQuotes: Quote[] = [ { id: 'Q001', type: 'marine', title: 'Marine Cargo Insurance - Machinery', amount: 18500, status: 'pending', createdDate: new Date(new Date().setDate(new Date().getDate() - 5)), expiryDate: new Date(new Date().setDate(new Date().getDate() + 9)), description: 'For heavy machinery shipment from Germany.' }, { id: 'Q003', type: 'travel', title: 'Schengen Visa Travel Insurance', amount: 4800, status: 'pending', createdDate: new Date(new Date().setDate(new Date().getDate() - 2)), expiryDate: new Date(new Date().setDate(new Date().getDate() + 12)), description: 'Annual multi-trip coverage for Europe.' }, { id: 'Q002', type: 'travel', title: 'Old Business Travel Insurance', amount: 3200, status: 'pending', createdDate: new Date( new Date().setDate(new Date().getDate() - 20) ), expiryDate: new Date( new Date().setDate(new Date().getDate() - 6) ), description: 'This is an old, expired quote.' } ];
    activePolicies: Policy[] = [ { id: 'P001', type: 'marine', title: 'Marine Cargo Policy - Electronics', policyNumber: 'MAR-2025-001', status: 'completed', premium: 1667.85, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), certificateUrl: '/simulated/MAR-2025-001.pdf', transactionDetails: { refNo: 'GQZTQTHNDXKJ', client: 'PETER OLINGO MUGENYA', transactionDate: new Date('2025-08-18'), sumInsured: 302010.0, netPremium: 1667.85 } }, { id: 'P002', type: 'marine', title: 'Marine Cargo Policy - Construction', policyNumber: 'MAR-2025-002', status: 'active', premium: 25500.0, startDate: new Date('2025-02-15'), endDate: new Date('2026-02-15'), certificateUrl: '/simulated/MAR-2025-002.pdf', transactionDetails: { refNo: 'HQWERTYNDXKJ', client: 'CONSTRUCTION LTD', transactionDate: new Date('2025-02-15'), sumInsured: 1500000.0, netPremium: 25500.0 } }, { id: 'P003', type: 'travel', title: 'Business Travel Insurance - Europe', policyNumber: 'TRV-2025-001', status: 'active', premium: 31510.6, startDate: new Date('2025-03-01'), endDate: new Date('2026-03-01'), certificateUrl: '/simulated/TRV-2025-001.pdf', transactionDetails: { refNo: 'TRVEUROPEXKJ', client: 'BONFACE ODHIAMBO', transactionDate: new Date('2025-03-01'), sumInsured: 50000.0, netPremium: 31510.6 } } ];
    recentActivities: Activity[] = [];
    isMobileSidebarOpen = false;
    expandedPolicyId: string | null = null;

    constructor( private dialog: MatDialog, public router: Router, private snackBar: MatSnackBar ) {}
    ngOnInit(): void { this.loadDashboardData(); this.setupNavigationBasedOnRole(); this.loadRecentActivities(); }
    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
    @HostListener('window:resize', ['$event']) onResize(event: any): void { if (window.innerWidth >= 1024) { this.isMobileSidebarOpen = false; } }
    loadRecentActivities(): void { this.recentActivities = [ { id: 'A001', type: 'payment_made', title: 'Payment Successful', description: 'Travel Insurance for Europe', timestamp: new Date(Date.now() - 3600000), icon: 'payment', iconColor: '#1DAEEB', relatedId: 'P003' }, { id: 'A002', type: 'policy_downloaded', title: 'Certificate Downloaded', description: 'Marine Cargo Policy MAR-2025-002', timestamp: new Date(Date.now() - 14400000), icon: 'download', iconColor: '#10b981', relatedId: 'P002' }, { id: 'A003', type: 'profile_updated', title: 'Profile Updated', description: 'Contact information updated', timestamp: new Date(Date.now() - 86400000), icon: 'person', iconColor: '#8b5cf6' } ]; }
    handleActivityClick(activity: Activity): void { if (activity.relatedId) { this.expandedPolicyId = activity.relatedId; this.snackBar.open(`Viewing details for ${activity.title}`, 'OK', { duration: 2000 }); } else { this.router.navigate(['/profile']); } }
    togglePolicyDetails(policyId: string): void { this.expandedPolicyId = this.expandedPolicyId === policyId ? null : policyId; }
    getInitials(name: string): string { return name.split(' ').map((n) => n[0]).join('').substring(0, 2); }
    getRoleDisplayName(): string { return 'Individual Client'; }
    getRoleColor(): string { return 'role-indicator individual'; }
    getUnreadNotificationCount(): number { return this.notifications.filter((n) => !n.read).length; }
    toggleNavItem(item: NavigationItem): void { if (item.children) item.isExpanded = !item.isExpanded; }
    toggleMobileSidebar(): void { this.isMobileSidebarOpen = !this.isMobileSidebarOpen; }
    getPendingQuotes(): Quote[] { const fourteenDaysAgo = new Date(); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14); return this.savedQuotes.filter( (quote) => quote.status === 'pending' && quote.createdDate >= fourteenDaysAgo ); }
    editQuoteByType(quoteId: string, type: 'marine' | 'travel'): void { const route = type === 'marine' ? '/sign-up/marine-quote' : '/sign-up/travel-quote'; this.router.navigate([route], { queryParams: { editId: quoteId } }); }
    initiateMpesaPayment(quoteId: string): void { const quote = this.savedQuotes.find((q) => q.id === quoteId); if (quote) { this.openMpesaModal({ amount: quote.amount, phoneNumber: this.user.phoneNumber, reference: quote.id, description: quote.title }); } }
    private openMpesaModal(paymentData: MpesaPayment): void { this.dialog.open(MpesaPaymentModalComponent, { data: paymentData, panelClass: 'mpesa-modal-panel' }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => { if (result && result.success) { const quote = this.savedQuotes.find((q) => q.id === result.reference); if (quote) { quote.status = 'completed'; this.loadDashboardData(); this.snackBar.open(`Payment for "${quote.title}" received!`, 'OK', { duration: 5000 }); } } }); }
    downloadCertificate(policyId: string): void { const policy = this.activePolicies.find((p) => p.id === policyId); if (policy?.certificateUrl) { this.snackBar.open(`Downloading certificate for ${policy.title}...`, 'Close', { duration: 3000 }); const link = document.createElement('a'); link.href = policy.certificateUrl; link.download = `${policy.policyNumber}-certificate.pdf`; link.click(); } }
    markNotificationAsRead(notification: Notification): void { notification.read = true; if (notification.actionUrl) { document.querySelector(notification.actionUrl)?.scrollIntoView({ behavior: 'smooth' }); } }
    setupNavigationBasedOnRole(): void { this.navigationItems = [ { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }, { label: 'My Quotes', icon: 'description', badge: this.getPendingQuotes().length, children: [ { label: 'Pending', route: '/quotes/pending', icon: 'pending' }, { label: 'Completed', route: '/quotes/completed', icon: 'check' } ] } ]; }
    loadDashboardData(): void { this.dashboardStats = { marinePolicies: this.activePolicies.filter((p) => p.type === 'marine').length, travelPolicies: this.activePolicies.filter((p) => p.type === 'travel').length, pendingQuotes: this.getPendingQuotes().length, totalPremium: this.activePolicies.reduce((sum, p) => sum + p.premium, 0) }; }
    logout(): void { if (confirm('Are you sure you want to logout?')) { this.router.navigate(['/sign-in']); } }
}