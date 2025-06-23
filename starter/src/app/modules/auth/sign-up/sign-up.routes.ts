import { Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { TravelQuoteComponent } from '../travel-quote/travel-quote.component';
import { UserRegistrationComponent } from '../user-registration/user-registration.component';
import { AuthSignUpComponent } from './sign-up.component';

export default [
    {
        path: '',
        component: AuthSignUpComponent,
    },
    {
        path: 'marine-quote',
        component: UserRegistrationComponent,
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    {
        path: 'travel-quote',
        component: TravelQuoteComponent,
    },
] as Routes;
