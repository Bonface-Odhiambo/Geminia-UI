import { Routes } from '@angular/router';
import { AuthSignUpComponent } from './sign-up.component';
import { UserRegistrationComponent } from '../user-registration/user-registration.component';
import { DashboardComponent } from '../dashboard/dashboard.component';

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
    path:'dashboard',
    component: DashboardComponent,
},

] as Routes;