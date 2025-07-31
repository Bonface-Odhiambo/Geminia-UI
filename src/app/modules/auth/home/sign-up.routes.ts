import { Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { MarineGuardProComponent } from '../marine-guard-pro/marine-guard-pro.component';
import { TravelQuoteComponent } from '../travel-quote/travel-quote.component';
import { AuthSignUpComponent } from './sign-up.component'; 
import { MarineCargoQuotationComponent } from '../user-registration/user-registration.component';


export default [
    {
        path: '',
        component: AuthSignUpComponent,
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    {
        path: 'travel-quote',
        component: TravelQuoteComponent,
    },
    {
        path: 'marine-guard-pro',
        component: MarineGuardProComponent,
    },
    {
        path: 'marine-quote',
        // This route now correctly uses the imported UserRegistrationComponent
        component: MarineCargoQuotationComponent,
    },
] as Routes;