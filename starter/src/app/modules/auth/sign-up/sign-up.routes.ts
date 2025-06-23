import { Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
// import { QuoteFormComponent } from '../quote-process/quote-form.component';
import { UserRegistrationComponent } from '../user-registration/user-registration.component';
import { AuthSignUpComponent } from './sign-up.component';

export default [
    {
        path: '',
        component: AuthSignUpComponent,
    },
    {
        path: 'user-registration',
        component: UserRegistrationComponent,
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    // {
    //     path: 'travel-quote',
    //     component: QuoteFormComponent,
    // },
] as Routes;
