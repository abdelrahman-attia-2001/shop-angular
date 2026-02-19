import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../../service/user-service';
import { CartService } from '../../../service/cart';
import { CartItem } from '../../../models/cart-item';
import { CheckoutApiService } from '../../../service/checkout-api-service';
import Swal from 'sweetalert2';

interface PaymentMethod {
  id: 'cash' | 'card';
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private checkoutApi = inject(CheckoutApiService);
  private userService = inject(UserService);
  private router = inject(Router);

  shippingForm!: FormGroup;
  cartItems: CartItem[] = [];
  cartId = '';

  currentStep = 1;

  paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash on Delivery', icon: 'payments', description: 'Pay with cash when your order arrives' },
    { id: 'card', name: 'Credit / Debit Card', icon: 'credit_card', description: 'Pay securely online via Stripe' }
  ];
  selectedPaymentMethod = this.paymentMethods[0];

  subtotal = 0;
  discount = 0;
  total = 0;

  isProcessing = false;
  isLoadingCart = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    // ✅ تحقق من الـ authentication أولاً
    if (!this.checkoutApi.isAuthenticated()) {
      console.warn('⚠️ User not authenticated, redirecting to login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/checkout' } 
      });
      return;
    }

    this.initForm();
    this.loadCart();
    this.prefillUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.shippingForm = this.fb.group({
      details: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      city: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  loadCart(): void {
    // 1. اشترك في cart items
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
        this.calculateTotals();
        
        // ✅ تحقق من وجود items في الـ cart
        if (items.length === 0) {
          console.warn('⚠️ No items in cart');
          this.errorMessage = 'Your cart is empty. Please add items first.';
        }
      });

    // 2. اشترك في cartId
    this.cartService.cartId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        if (id) {
          this.cartId = id;
          console.log('✅ Got cartId from service:', id);
        }
      });

    // 3. حاول تجيب cartId من localStorage
    this.cartId = this.cartService.getCartId();

    // 4. لو مفيش cartId، اجلبه من API
    if (!this.cartId) {
      console.log('⚠️ No cartId found, fetching from API...');
      this.fetchCartFromApi();
    } else {
      console.log('✅ cartId found in storage:', this.cartId);
      this.isLoadingCart = false;
    }
  }

  private fetchCartFromApi(): void {
    this.cartService.getCartFromApi()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res) {
            this.cartId = res?.data?._id || '';
            this.isLoadingCart = false;
            
            if (this.cartId) {
              console.log('✅ cartId fetched from API:', this.cartId);
            } else {
              console.warn('⚠️ No cartId in API response');
              this.errorMessage = 'Your cart is empty. Please add items first.';
            }
          } else {
            this.isLoadingCart = false;
            console.warn('⚠️ API returned null');
            this.errorMessage = 'Could not load cart. Please try again.';
          }
        },
        error: (err) => {
          this.isLoadingCart = false;
          console.error('❌ Failed to fetch cart:', err);
          
          if (err.status === 401) {
            this.errorMessage = 'Session expired. Please login again.';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.errorMessage = 'Could not load cart. Please try again.';
          }
        }
      });
  }

  prefillUserData(): void {
    const user = this.userService.getUserData();
    if (user?.phone) {
      this.shippingForm.patchValue({ phone: user.phone });
    }
  }

  calculateTotals(): void {
    this.subtotal = this.cartService.getCartSubtotal();
    this.discount = this.cartService.getTotalDiscount();
    this.total = this.cartService.getCartTotal();
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.shippingForm.valid) {
        this.currentStep = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.shippingForm.markAllAsTouched();
      }
    } else if (this.currentStep === 2) {
      this.currentStep = 3;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  placeOrder(): void {
    console.log('🚀 Starting order placement...');
    
    // ✅ التحقق من الفورم
    if (!this.shippingForm.valid) {
      console.warn('⚠️ Form invalid');
      this.currentStep = 1;
      this.shippingForm.markAllAsTouched();
      return;
    }

    // ✅ التحقق من الـ authentication
    if (!this.checkoutApi.isAuthenticated()) {
      this.errorMessage = 'Please login to place order';
      this.router.navigate(['/login']);
      return;
    }

    // ✅ التحقق من وجود items في الـ cart
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Your cart is empty. Please add items first.';
      return;
    }

    // ✅ تأكد من وجود cartId
    if (!this.cartId) {
      this.cartId = this.cartService.getCartId();
    }

    if (!this.cartId) {
      this.errorMessage = 'Cart ID not found. Please refresh the page and try again.';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = null;

    const shippingAddress = {
      details: this.shippingForm.value.details,
      phone: this.shippingForm.value.phone,
      city: this.shippingForm.value.city
    };

    console.log('🛒 Order Details:', {
      cartId: this.cartId,
      shippingAddress,
      paymentMethod: this.selectedPaymentMethod.id,
      itemsCount: this.cartItems.length
    });

    if (this.selectedPaymentMethod.id === 'cash') {
  this.checkoutApi.createCashOrder(this.cartId, shippingAddress).subscribe({
    next: (res) => {
      console.log('✅ Cash order placed successfully:', res);
      this.isProcessing = false;
      this.cartService.clearCart();

      Swal.fire({
        icon: 'success',
        title: 'Order Placed Successfully!',
        text: 'Thank you for your order 🎉',
        timer: 2000,
        showConfirmButton: false,
        width: '320px',
      }).then(() => {
        this.router.navigate(['/orders']);
      });
    },
    error: (err) => {
      console.error('❌ Cash order failed:', err);
      this.isProcessing = false;

      if (err.status === 401) {
        this.errorMessage = 'Session expired. Please login again.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      } else {
        this.errorMessage = err?.error?.message || 'Failed to place order. Please try again.';
      }
    }
  });
} else {
      // ✅ Online Payment
      this.checkoutApi.createOnlineSession(this.cartId, shippingAddress).subscribe({
        next: (res) => {
          console.log('✅ Payment session created:', res);
          this.isProcessing = false;
          
          if (res?.session?.url) {
            // إعادة توجيه لصفحة الدفع
            window.location.href = res.session.url;
          } else {
            this.errorMessage = 'Payment session URL not received';
          }
        },
        error: (err) => {
          console.error('❌ Payment session failed:', err);
          this.isProcessing = false;
          
          if (err.status === 401) {
            this.errorMessage = 'Session expired. Please login again.';
            setTimeout(() => this.router.navigate(['/login']), 2000);
          } else {
            this.errorMessage = err?.error?.message || 'Failed to create payment session.';
          }
        }
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.shippingForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getFieldError(field: string): string {
    const control = this.shippingForm.get(field);
    if (control?.errors?.['required']) return 'This field is required';
    if (control?.errors?.['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control?.errors?.['pattern']) return 'Invalid Egyptian phone number (01XXXXXXXXX)';
    return '';
  }

  getItemPrice(item: CartItem): number {
    return item.priceAfterDiscount || item.price;
  }

  getItemTotal(item: CartItem): number {
    return this.getItemPrice(item) * item.selectedQuantity;
  }
}