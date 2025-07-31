import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewEncapsulation,
  inject,
  OnDestroy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { QuoteModalComponent } from '../shared';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, StoredUser } from '../shared/services/auth.service';

@Component({
  selector: 'auth-sign-up',
  standalone: true,
  imports: [ 
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule, 
    FuseAlertComponent, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatDialogModule, 
    MatRadioModule, 
    MatCheckboxModule 
  ],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('shake', [
      transition('* => *', [
        style({ transform: 'translateX(0)' }),
        animate('100ms ease-out', style({ transform: 'translateX(-10px)' })),
        animate('100ms ease-in', style({ transform: 'translateX(10px)' })),
        animate('100ms ease-out', style({ transform: 'translateX(-5px)' })),
        animate('100ms ease-in', style({ transform: 'translateX(5px)' })),
        animate('100ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class AuthSignUpComponent implements OnInit, OnDestroy {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _dialog = inject(MatDialog);
  private _cd = inject(ChangeDetectorRef);
  private _unsubscribeAll = new Subject<void>();

  // Inject the AuthService
  private authService = inject(AuthService);

  formType: 'login' | 'register' = 'login';
  signInForm!: FormGroup;
  registerForm!: FormGroup;
  showPassword = false;
  showAlert = false;
  alert: { 
    type: FuseAlertType; 
    message: string; 
    position: 'inline' | 'bottom'; 
  } = { 
    type: 'error', 
    message: '', 
    position: 'inline' 
  };

  ngOnInit(): void {
    this.initializeForms();
    this.checkExistingCredentials();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private initializeForms(): void {
    this.signInForm = this._formBuilder.group({ 
      username: ['', [Validators.required, Validators.email]], 
      password: ['', Validators.required] 
    });

    this.registerForm = this._formBuilder.group({ 
      accountType: ['individual', Validators.required], 
      fullName: ['', Validators.required], 
      email: ['', [Validators.required, Validators.email]], 
      kraPin: ['', Validators.required], 
      phoneNumber: ['', Validators.required], 
      iraNumber: [''], 
      pinNumber: [''], 
      password: ['', Validators.required], 
      agreementAccepted: [false, Validators.requiredTrue] 
    });
  }

  private setupFormSubscriptions(): void {
    this.registerForm.get('accountType')?.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((type) => { 
        this.updateValidators(type); 
      });
    this.updateValidators('individual');
  }

  private checkExistingCredentials(): void {
    const storedUser = this.authService.getStoredUser();
    if (storedUser) {
      // Auto-fill the username if user was previously logged in
      this.signInForm.patchValue({
        username: storedUser.username
      });
    }
  }

  togglePasswordVisibility(): void { 
    this.showPassword = !this.showPassword; 
  }

  signIn(): void {
    if (this.signInForm.invalid) { 
      this.triggerAlert('error', 'Please fill in all required fields.', 'inline'); 
      return; 
    }
    
    this.signInForm.disable();
    this.showAlert = false;
    
    setTimeout(() => { 
      this.handleCredentialAuthentication(); 
    }, 1500);
  }

  register(): void {
    if (this.registerForm.invalid) { 
      this.triggerAlert('error', 'Please fill in all required fields and accept the policies.', 'inline'); 
      return; 
    }
    
    this.registerForm.disable();
    this.showAlert = false;
    
    setTimeout(() => {
      // Store registration data using the auth service
      this.storeRegistrationData();
      
      this.triggerAlert('info', 'Account created successfully! You can now sign in.', 'bottom');
      this.formType = 'login';
      this.registerForm.enable();
      this.registerForm.reset({ accountType: 'individual' });
      this.updateValidators('individual');
    }, 1500);
  }

  private handleCredentialAuthentication(): void {
    const { username, password } = this.signInForm.getRawValue();
    
    if (this.authService.login(username, password)) {
      this.triggerAlert('info', 'Sign in successful! Redirecting...', 'bottom');
      setTimeout(() => this._router.navigate(['/sign-up/dashboard']), 2000);
    } else {
      this.triggerAlert('error', 'Invalid credentials. Please try again.', 'inline');
      this.signInForm.enable();
    }
  }

  private storeRegistrationData(): void {
    const formData = this.registerForm.getRawValue();
    this.authService.storeRegistrationData(formData);
  }

  private triggerAlert(type: FuseAlertType, message: string, position: 'inline' | 'bottom'): void {
    this.alert = { type, message, position };
    this.showAlert = true;
    this._cd.markForCheck();
    
    setTimeout(() => { 
      this.showAlert = false; 
      this._cd.markForCheck(); 
    }, 5000);
  }

  private updateValidators(accountType: string): void {
    const individualControls = ['fullName', 'email', 'kraPin', 'phoneNumber'];
    const intermediaryControls = ['iraNumber', 'pinNumber'];
    
    if (accountType === 'individual') {
      individualControls.forEach((controlName) => 
        this.registerForm.get(controlName)?.setValidators([Validators.required])
      );
      intermediaryControls.forEach((controlName) => 
        this.registerForm.get(controlName)?.clearValidators()
      );
    } else {
      intermediaryControls.forEach((controlName) => 
        this.registerForm.get(controlName)?.setValidators([Validators.required])
      );
      individualControls.forEach((controlName) => 
        this.registerForm.get(controlName)?.clearValidators()
      );
    }
    
    Object.keys(this.registerForm.controls).forEach((key) => { 
      this.registerForm.get(key)?.updateValueAndValidity({ emitEvent: false }); 
    });
  }

  navigateToMarineQuote(): void { 
    this.openQuoteModal('marine'); 
  }

  navigateToTravelQuote(): void { 
    this.openQuoteModal('travel'); 
  }

  private openQuoteModal(insuranceType: 'marine' | 'travel'): void {
    const dialogRef = this._dialog.open(QuoteModalComponent, { 
      width: '500px', 
      maxWidth: '90vw', 
      data: { insuranceType } 
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.triggerAlert('info', `Your ${insuranceType} insurance quote request was submitted. We will contact you shortly.`, 'bottom');
      }
    });
  }

  // Public methods for other components to use
  public getStoredUser(): StoredUser | null {
    return this.authService.getStoredUser();
  }

  public getStoredCredentials(): { username: string; password: string; type: string } | null {
    return this.authService.getStoredCredentials();
  }

  public clearStoredData(): void {
    this.authService.logout();
  }

  public isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Additional utility methods
  public getCurrentUser(): StoredUser | null {
    return this.authService.getCurrentUser();
  }

  public getUserType(): 'individual' | 'intermediary' | null {
    return this.authService.getUserType();
  }

  public getRegistrationData(): any {
    return this.authService.getRegistrationData();
  }

  // Method to handle logout (if needed)
  public logout(): void {
    this.authService.logout();
    this.signInForm.reset();
    this.registerForm.reset({ accountType: 'individual' });
    this.updateValidators('individual');
    this.formType = 'login';
    this.triggerAlert('info', 'You have been logged out successfully.', 'bottom');
  }

  // Method to switch between login and register forms
  public switchToLogin(): void {
    this.formType = 'login';
    this.showAlert = false;
  }

  public switchToRegister(): void {
    this.formType = 'register';
    this.showAlert = false;
  }

  // Method to pre-fill form with stored data (useful for editing)
  public prefillWithStoredData(): void {
    const registrationData = this.authService.getRegistrationData();
    if (registrationData) {
      this.registerForm.patchValue(registrationData);
      this.updateValidators(registrationData.accountType || 'individual');
    }
  }

  // Method to check if user has previously registered
  public hasRegistrationData(): boolean {
    return !!this.authService.getRegistrationData();
  }

  // Method to validate email format (additional validation)
  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Method to validate KRA PIN format
  public isValidKRAPin(kraPin: string): boolean {
    const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/i;
    return kraPinRegex.test(kraPin);
  }

  // Method to validate phone number format
  public isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^(07|01)\d{8}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Method to get form validation errors for display
  public getFormErrors(form: FormGroup): string[] {
    const errors: string[] = [];
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.invalid && (control.dirty || control.touched)) {
        if (control.errors?.['required']) {
          errors.push(`${this.getFieldDisplayName(key)} is required`);
        }
        if (control.errors?.['email']) {
          errors.push(`${this.getFieldDisplayName(key)} must be a valid email`);
        }
        if (control.errors?.['pattern']) {
          errors.push(`${this.getFieldDisplayName(key)} format is invalid`);
        }
      }
    });
    return errors;
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'username': 'Email Address',
      'password': 'Password',
      'fullName': 'Full Name',
      'email': 'Email Address',
      'kraPin': 'KRA PIN',
      'phoneNumber': 'Phone Number',
      'iraNumber': 'IRA Number',
      'pinNumber': 'PIN Number',
      'accountType': 'Account Type',
      'agreementAccepted': 'Terms Agreement'
    };
    return fieldNames[fieldName] || fieldName;
  }

  // Method to handle form reset
  public resetForms(): void {
    this.signInForm.reset();
    this.registerForm.reset({ accountType: 'individual' });
    this.updateValidators('individual');
    this.showAlert = false;
    this.showPassword = false;
  }

  // Method to handle session timeout
  public handleSessionTimeout(): void {
    this.authService.logout();
    this.triggerAlert('error', 'Your session has expired. Please sign in again.', 'inline');
    this.formType = 'login';
    this.resetForms();
  }
}