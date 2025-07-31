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

@Component({
  selector: 'auth-sign-up',
  standalone: true,
  imports: [ CommonModule, RouterModule, ReactiveFormsModule, FuseAlertComponent, MatIconModule, MatProgressSpinnerModule, MatDialogModule, MatRadioModule, MatCheckboxModule ],
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

  private readonly VALID_USERS = [ { username: 'individual@geminia.com', password: 'password123', type: 'individual' }, { username: 'intermediary@geminia.com', password: 'password456', type: 'intermediary' } ];

  formType: 'login' | 'register' = 'login';
  signInForm!: FormGroup;
  registerForm!: FormGroup;
  showPassword = false;
  showAlert = false;
  alert: { type: FuseAlertType; message: string; position: 'inline' | 'bottom'; } = { type: 'error', message: '', position: 'inline' };

  ngOnInit(): void {
    this.signInForm = this._formBuilder.group({ username: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
    this.registerForm = this._formBuilder.group({ accountType: ['individual', Validators.required], fullName: ['', Validators.required], email: ['', [Validators.required, Validators.email]], kraPin: ['', Validators.required], phoneNumber: ['', Validators.required], iraNumber: [''], pinNumber: [''], password: ['', Validators.required], agreementAccepted: [false, Validators.requiredTrue] });
    this.registerForm.get('accountType').valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((type) => { this.updateValidators(type); });
    this.updateValidators('individual');
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }

  signIn(): void {
    if (this.signInForm.invalid) { this.triggerAlert('error', 'Please fill in all required fields.', 'inline'); return; }
    this.signInForm.disable();
    this.showAlert = false;
    setTimeout(() => { this.handleCredentialAuthentication(); }, 1500);
  }

  register(): void {
    if (this.registerForm.invalid) { this.triggerAlert('error', 'Please fill in all required fields and accept the policies.', 'inline'); return; }
    this.registerForm.disable();
    this.showAlert = false;
    setTimeout(() => {
      // CHANGED: Using 'info' type to trigger the blue toast
      this.triggerAlert('info', 'Account created successfully! You can now sign in.', 'bottom');
      this.formType = 'login';
      this.registerForm.enable();
      this.registerForm.reset({ accountType: 'individual' });
      this.updateValidators('individual');
    }, 1500);
  }

  private handleCredentialAuthentication(): void {
    const { username, password } = this.signInForm.getRawValue();
    const user = this.VALID_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);

    if (user) {
      // CHANGED: Using 'info' type to trigger the blue toast
      this.triggerAlert('info', 'Sign in successful! Redirecting...', 'bottom');
      setTimeout(() => this._router.navigate(['/sign-up/dashboard']), 2000);
    } else {
      this.triggerAlert('error', 'Invalid credentials. Please try again.', 'inline');
      this.signInForm.enable();
    }
  }

  private triggerAlert(type: FuseAlertType, message: string, position: 'inline' | 'bottom'): void {
    this.alert = { type, message, position };
    this.showAlert = true;
    this._cd.markForCheck();
    setTimeout(() => { this.showAlert = false; this._cd.markForCheck(); }, 5000);
  }

  private updateValidators(accountType: string): void {
    const individualControls = ['fullName', 'email', 'kraPin', 'phoneNumber'];
    const intermediaryControls = ['iraNumber', 'pinNumber'];
    if (accountType === 'individual') {
      individualControls.forEach((controlName) => this.registerForm.get(controlName).setValidators([Validators.required]));
      intermediaryControls.forEach((controlName) => this.registerForm.get(controlName).clearValidators());
    } else {
      intermediaryControls.forEach((controlName) => this.registerForm.get(controlName).setValidators([Validators.required]));
      individualControls.forEach((controlName) => this.registerForm.get(controlName).clearValidators());
    }
    Object.keys(this.registerForm.controls).forEach((key) => { this.registerForm.get(key).updateValueAndValidity({ emitEvent: false }); });
  }

  navigateToMarineQuote(): void { this.openQuoteModal('marine'); }
  navigateToTravelQuote(): void { this.openQuoteModal('travel'); }

  private openQuoteModal(insuranceType: 'marine' | 'travel'): void {
    const dialogRef = this._dialog.open(QuoteModalComponent, { width: '500px', maxWidth: '90vw', data: { insuranceType } });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        // CHANGED: Using 'info' type to trigger the blue toast for consistency
        this.triggerAlert('info', `Your ${insuranceType} insurance quote request was submitted. We will contact you shortly.`, 'bottom');
      }
    });
  }
}