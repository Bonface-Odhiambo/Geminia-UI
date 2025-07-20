import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewEncapsulation,
  inject,
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
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { QuoteModalComponent } from '../shared';

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
export class AuthSignUpComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _dialog = inject(MatDialog);
  private _cd = inject(ChangeDetectorRef);

  private readonly VALID_CREDENTIALS = {
    username: 'principalresearcher138@gmail.com',
    password: '1234567',
  };

  signInForm!: FormGroup;
  showPassword = false;
  showAlert = false;
  alert: { type: FuseAlertType; message: string } = {
    type: 'error',
    message: '',
  };

  ngOnInit(): void {
    this.signInForm = this._formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {
    if (this.signInForm.invalid) {
      this.triggerAlert('error', 'Please fill in all required fields.');
      return;
    }

    this.signInForm.disable();
    this.showAlert = false;

    setTimeout(() => {
      this.handleCredentialAuthentication();
    }, 1500);
  }

  /**
   * Opens the quote modal for Marine Insurance.
   */
  navigateToMarineQuote(): void {
    this.openQuoteModal('marine');
  }

  /**
   * Opens the quote modal for Travel Insurance.
   */
  navigateToTravelQuote(): void {
    this.openQuoteModal('travel');
  }

  /**
   * Opens the quote modal dialog with the specified insurance type.
   */
  private openQuoteModal(insuranceType: 'marine' | 'travel'): void {
    const dialogRef = this._dialog.open(QuoteModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { insuranceType },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.triggerAlert(
          'success',
          `Your ${insuranceType} insurance quote request was submitted. We will contact you shortly.`
        );
      }
    });
  }

  private handleCredentialAuthentication(): void {
    const { username, password } = this.signInForm.getRawValue();

    if (
      username.toLowerCase().trim() === this.VALID_CREDENTIALS.username &&
      password === this.VALID_CREDENTIALS.password
    ) {
      this.triggerAlert('success', 'Sign in successful! Redirecting...');
      setTimeout(() => this._router.navigate(['/dashboard']), 1500);
    } else {
      this.triggerAlert('error', 'Invalid credentials. Please try again.');
      this.signInForm.enable();
    }
  }

  private triggerAlert(type: FuseAlertType, message: string): void {
    this.alert = { type, message };
    this.showAlert = true;
    this._cd.markForCheck();
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }
}