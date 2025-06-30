import { Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { MarineGuardProComponent } from '../marine-guard-pro/marine-guard-pro.component';
import { UserRegistrationComponent } from '../sign-up/auth-sign-up.component';
import { TravelQuoteComponent } from '../travel-quote/travel-quote.component';
import { MarineCargoQuotationComponent } from '../user-registration/user-registration.component';
import { AuthSignUpComponent } from './sign-up.component';

export default [
    {
        path: '',
        component: AuthSignUpComponent,
    },
    {
        path: 'marine-quote',
        component: MarineCargoQuotationComponent,
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
        path:'marine-guard-pro',
        component:MarineGuardProComponent
    },{
        path: 'user-registration',
        component:UserRegistrationComponent
    }
] as Routes;
