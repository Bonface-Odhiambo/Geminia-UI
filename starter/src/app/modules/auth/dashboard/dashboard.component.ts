import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

interface User {
  name: string;
  email: string;
}

interface DashboardStats {
  lifeActivePolicies: number;
  lifePendingTransactions: number;
  lifePendingProposals: number;
  others: number;
  lifeQuotes: number;
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
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: User = {
    name: 'Bonface Odhiambo',
    email: 'bonface@example.com'
  };

  dashboardStats: DashboardStats = {
    lifeActivePolicies: 0,
    lifePendingTransactions: 0,
    lifePendingProposals: 0,
    others: 0,
    lifeQuotes: 0
  };

  // Sidebar toggle states
  isLifeInsuranceOpen = false;
  isGeneralInsuranceOpen = false;
  isPensionsOpen = false;

  constructor() { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load dashboard statistics from your service
    // This is mock data - replace with actual service calls
    this.dashboardStats = {
      lifeActivePolicies: 0,
      lifePendingTransactions: 0,
      lifePendingProposals: 0,
      others: 0,
      lifeQuotes: 0
    };
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
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