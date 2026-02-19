import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { CartService } from '../../../service/cart';
import { WishlistService } from '../../../service/wishlist';
import { OrdersService } from '../../../service/orders';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Counters
  cartCount = 0;
  wishlistCount = 0;
  activeOrdersCount = 0;

  // UI States
  isMobileMenuOpen = false;
  isUserMenuOpen = false;

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private ordersService: OrdersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart count
    this.cartService.cartCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.cartCount = count;
      });

    // Subscribe to wishlist count
    this.wishlistService.wishlistCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.wishlistCount = count;
      });

    // Subscribe to orders - count only active orders
    this.ordersService.orders$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.activeOrdersCount = orders.filter(
          o => !o.isDelivered
        ).length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation
  goToCart(): void {
    this.router.navigate(['/cart']);
    this.closeMobileMenu();
  }

  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
    this.closeMobileMenu();
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
    this.closeMobileMenu();
  }

  // Menu toggles
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // User actions
  logout(): void {
    Swal.fire({
      title: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {
        console.log('User logged out');
        // Clear user data if needed
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('rememberedEmail');
        this.router.navigate(['/login']);
      }
    });
  }
}