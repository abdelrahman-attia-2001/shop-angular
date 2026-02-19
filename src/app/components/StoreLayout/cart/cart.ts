import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CartService } from '../../../service/cart';
import { CartItem } from '../../../models/cart-item';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, RouterLink],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cartItems: CartItem[] = [];
  
  subtotal = 0;
  discount = 0;
  deliveryFee = 0;
  tax = 0;
  total = 0;

  freeDeliveryThreshold = 100;
  deliveryBaseFee = 15;

  promoCode = '';
  appliedPromoCode = '';
  promoDiscount = 0;

  isLoggedIn = false;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('userToken');
    this.isLoggedIn = !!token && token.length > 0;
  }

  loadCart(): void {
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
        this.calculateTotals();
      });

    if (this.isLoggedIn) {
      this.cartService.getCartFromApi()
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  calculateTotals(): void {
    this.subtotal = this.cartService.getCartSubtotal();
    this.discount = this.cartService.getTotalDiscount();

    const cartTotal = this.cartService.getCartTotal();
    this.deliveryFee = cartTotal >= this.freeDeliveryThreshold ? 0 : this.deliveryBaseFee;
    this.tax = (cartTotal + this.deliveryFee) * 0.1;
    this.total = cartTotal + this.deliveryFee + this.tax - this.promoDiscount;
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Cart is empty!', timer: 1500, showConfirmButton: false });
      return;
    }

    if (!this.isLoggedIn) {
      Swal.fire({ icon: 'info', title: 'Please login to proceed to checkout', timer: 2000, showConfirmButton: false });
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    if (this.appliedPromoCode) {
      localStorage.setItem('appliedPromo', JSON.stringify({
        code: this.appliedPromoCode,
        discount: this.promoDiscount
      }));
    }

    this.router.navigate(['/checkout']);
  }

  incrementQuantity(item: CartItem): void {
    if (item.selectedQuantity < item.quantity) {
      this.cartService.updateQuantity(item._id, item.selectedSize, item.selectedColor, item.selectedQuantity + 1);
    }
  }

  decrementQuantity(item: CartItem): void {
    if (item.selectedQuantity > 1) {
      this.cartService.updateQuantity(item._id, item.selectedSize, item.selectedColor, item.selectedQuantity - 1);
    }
  }

  async removeItem(item: CartItem): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: `Remove ${item.title}?`,
      text: 'This item will be removed from your cart',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      cancelButtonText: 'Keep it',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });
    if (result.isConfirmed) {
      this.cartService.removeFromCart(item._id, item.selectedSize, item.selectedColor);
    }
  }

  async clearCart(): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Clear entire cart?',
      text: 'All items will be removed',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });
    if (result.isConfirmed) {
      this.cartService.clearCart();
    }
  }

  applyPromoCode(): void {
    const promoCodes: { [key: string]: number } = {
      'SAVE10': 10,
      'SAVE20': 20,
      'WELCOME': 15
    };

    const code = this.promoCode.toUpperCase().trim();

    if (promoCodes[code]) {
      this.appliedPromoCode = code;
      this.promoDiscount = promoCodes[code];
      this.calculateTotals();
      Swal.fire({ icon: 'success', title: 'Promo Applied!', text: `You saved $${promoCodes[code]}`, timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: 'error', title: 'Invalid Code', text: 'This promo code is not valid', timer: 1500, showConfirmButton: false });
    }
  }

  removePromoCode(): void {
    this.appliedPromoCode = '';
    this.promoCode = '';
    this.promoDiscount = 0;
    this.calculateTotals();
  }

  getItemPrice(item: CartItem): number {
    return item.priceAfterDiscount || item.price;
  }

  getItemTotal(item: CartItem): number {
    return this.getItemPrice(item) * item.selectedQuantity;
  }

  getProgressToFreeDelivery(): number {
    const total = this.cartService.getCartTotal();
    return Math.min((total / this.freeDeliveryThreshold) * 100, 100);
  }

  getRemainingForFreeDelivery(): number {
    return Math.max(this.freeDeliveryThreshold - this.cartService.getCartTotal(), 0);
  }
}