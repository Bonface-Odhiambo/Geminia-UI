import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";
import { AuthService } from "app/core/auth/auth.service";
import { QuoteModalComponent } from "../shared";


@Component({
  selector: "auth-sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.css"],
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
  standalone: true,
  imports: [
    RouterLink,
    FuseAlertComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
})
export class AuthSignUpComponent implements OnInit {
  alert: { type: FuseAlertType; message: string } = {
    type: "success",
    message: "",
  };
  showAlert: boolean = false;

  constructor(
    private _authService: AuthService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router,
    private _dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    // Component initialization if needed
  }

  /**
   * Navigate to registration page
   * Note: This method is not used in the current template but is kept for potential future use.
   */
  navigateToRegistration(): void {
    this._router.navigateByUrl("/sign-up/user-registration");
  }

  /**
   * Navigate to marine quote
   */
  navigateToMarineQuote(): void {
    this.openQuoteModal("marine");
  }

  /**
   * Navigate to motor quote
   */
  navigateToMotorQuote(): void {
    this.openQuoteModal("motor");
  }

  /**
   * Open quote modal
   */
  private openQuoteModal(insuranceType: "marine" | "motor"): void {
    const dialogRef = this._dialog.open(QuoteModalComponent, {
      width: "500px",
      maxWidth: "90vw",
      data: { insuranceType },
      disableClose: false,
      autoFocus: true,
      panelClass: "quote-modal-panel",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        console.log(
          "Quote request submitted successfully:",
          result.data,
        );

        this.alert = {
          type: "success",
          message: `Your ${insuranceType} insurance quote request has been submitted successfully. Our team will contact you shortly.`,
        };
        this.showAlert = true;

        setTimeout(() => {
          this.showAlert = false;
        }, 5000);
      }
    });
  }
}