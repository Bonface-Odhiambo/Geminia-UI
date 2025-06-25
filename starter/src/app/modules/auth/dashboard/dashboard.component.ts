import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';

interface User {
    name: string;
    email: string;
}

// Updated interface to match the new cards
interface DashboardStats {
    marinePolicies: number;
    travelPolicies: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    user: User = {
        name: 'Bonface Odhiambo',
        email: 'bonface@example.com',
    };

    // Updated dashboardStats object to hold data for the new cards
    dashboardStats: DashboardStats = {
        marinePolicies: 0,
        travelPolicies: 0,
    };

    // Sidebar toggle states
    isLifeInsuranceOpen = false;
    isGeneralInsuranceOpen = false;
    isPensionsOpen = false;

    constructor() {}

    ngOnInit(): void {
        this.loadDashboardData();
    }

    loadDashboardData(): void {
        // Load dashboard statistics from your service
        // This is mock data - replace with actual service calls
        this.dashboardStats = {
            marinePolicies: 4, // Example data
            travelPolicies: 2, // Example data
        };
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    toggleLifeInsurance(): void {
        this.isLifeInsuranceOpen = !this.isLifeInsuranceOpen;
    }

    toggleGeneralInsurance(): void {
        this.isGeneralInsuranceOpen = !this.isGeneralInsuranceOpen;
    }

    togglePensions(): void {
        this.isPensionsOpen = !this.isPensionsOpen;
    }

    logout(): void {
        // Implement logout logic
        console.log('Logging out...');
    }
}
