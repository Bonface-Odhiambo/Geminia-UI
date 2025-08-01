// src/app/app.routes.ts

import { Route } from "@angular/router";
import { initialDataResolver } from "app/app.resolvers";
import { AuthGuard } from "app/core/auth/guards/auth.guard";
import { NoAuthGuard } from "app/core/auth/guards/noAuth.guard";
import { LayoutComponent } from "app/layout/layout.component";
import { AuthSignUpComponent } from "./modules/auth/home/sign-up.component";

export const appRoutes: Route[] = [
	// Root route without layout
	{
		path: "",
		pathMatch: "full",
		component: AuthSignUpComponent
	},

	// Redirect signed-in user to the '/dashboard'
	{ path: "signed-in-redirect", pathMatch: "full", redirectTo: "dashboard" },

	// Auth routes for guests
	{
		path: "",
		canActivate: [NoAuthGuard],
		canActivateChild: [NoAuthGuard],
		component: LayoutComponent,
		data: {
			layout: "empty",
		},
		children: [
			{
				path: "confirmation-required",
				loadChildren: () =>
					import(
						"app/modules/auth/confirmation-required/confirmation-required.routes"
					),
			},
			{
				path: "forgot-password",
				loadChildren: () =>
					import(
						"app/modules/auth/forgot-password/forgot-password.routes"
					),
			},
			{
				path: "reset-password",
				loadChildren: () =>
					import(
						"app/modules/auth/reset-password/reset-password.routes"
					),
			},
			{
				path: "sign-in",
				loadChildren: () =>
					import("app/modules/auth/sign-in/sign-in.routes"),
			},
			{
				path: "sign-up",
				loadChildren: () =>
					import("app/modules/auth/home/sign-up.routes"),
			},
		],
	},

	// Auth routes for authenticated users
	{
		path: "",
		canActivate: [AuthGuard], // Recommended: Protect all child routes
		canActivateChild: [AuthGuard],
		component: LayoutComponent,
		data: {
			layout: "empty", // Or your main app layout
		},
		children: [
            // --- FIX IS HERE ---
            {
                path: 'dashboard',
                loadChildren: () => import('app/modules/auth/dashboard/dashboard.routes'),
            },
            // --- END OF FIX ---
			{
				path: "sign-out",
				loadChildren: () =>
					import("app/modules/auth/sign-out/sign-out.routes"),
			},
			{
				path: "unlock-session",
				loadChildren: () =>
					import(
						"app/modules/auth/unlock-session/unlock-session.routes"
					),
			},
		],
	},

	// Landing routes
	{
		path: "",
		component: LayoutComponent,
		data: {
			layout: "empty",
		},
		children: [
			{
				path: "home",
				loadChildren: () =>
					import("app/modules/landing/home/home.routes"),
			},
		],
	},

	// Admin routes
	{
		path: "",
		canActivate: [AuthGuard],
		canActivateChild: [AuthGuard],
		component: LayoutComponent,
		resolve: {
			initialData: initialDataResolver,
		},
		children: [
			{
				path: "example",
				loadChildren: () =>
					import("app/modules/admin/example/example.routes"),
			},
		],
	},
];