import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap,catchError, of } from 'rxjs';
import { CartItem } from '../models/cart-item';

interface ApiCartResponse {
  status: string;
  numOfCartItems: number;
  data: {
    _id: string;
    cartItems: any[];
    totalCartPrice: number;
    user: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private baseUrl = 'https://ecommerce.routemisr.com/api/v1/cart';

  private cartItems = new BehaviorSubject<CartItem[]>(this.loadCartFromStorage());
  private cartCount = new BehaviorSubject<number>(0);
  private cartId = new BehaviorSubject<string>(this.loadCartIdFromStorage());

  cartItems$ = this.cartItems.asObservable();
  cartCount$ = this.cartCount.asObservable();
  cartId$ = this.cartId.asObservable();

  constructor() {
    this.updateCartCount();
  }

  // ─── Auth Check ────────────────────────────────────────────────
  private isLoggedIn(): boolean {
    const token = localStorage.getItem('userToken');
    return !!token && token.length > 0;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('userToken') || '';
    return new HttpHeaders({ token });
  }

  // ─── localStorage helpers ──────────────────────────────────────
  private loadCartFromStorage(): CartItem[] {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  }

  private loadCartIdFromStorage(): string {
    return localStorage.getItem('cartId') || '';
  }

  private saveCartToStorage(items: CartItem[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
  }

  private saveCartId(id: string): void {
    if (id) {
      localStorage.setItem('cartId', id);
      this.cartId.next(id);
      console.log('✅ cartId saved:', id);
    }
  }

  private updateCartCount(): void {
    const count = this.cartItems.value.reduce(
      (total, item) => total + item.selectedQuantity, 0
    );
    this.cartCount.next(count);
  }

  // ─── Add to cart ───────────────────────────────────────────────
  addToCart(product: any, selectedQuantity: number = 1, size?: string, color?: string): void {
    // 1. Always add to local cart first
    this.addToLocalCart(product, selectedQuantity, size, color);

    // 2. Only sync with API if logged in
    if (!this.isLoggedIn()) {
      console.warn('⚠️ User not logged in - cart saved locally only');
      return;
    }

    // 3. Validate product ID
    if (!product._id) {
      console.error('❌ Product ID is missing!');
      return;
    }

    console.log('🔄 Syncing cart with API...', { productId: product._id });

    this.http.post<ApiCartResponse>(
      this.baseUrl,
      { productId: product._id },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        console.log('✅ API Response:', res);
        if (res?.data?._id) {
          this.saveCartId(res.data._id);
        }
      },
      error: (err) => {
        console.error('❌ API Error:', err);
        // Don't show error to user - local cart still works
        if (err.status === 401) {
          console.warn('⚠️ Token expired - please login again');
        }
      }
    });
  }

  // ─── Local cart management ─────────────────────────────────────
  private addToLocalCart(product: any, selectedQuantity: number, size?: string, color?: string): void {
    const items = [...this.cartItems.value];
    const existingIndex = items.findIndex(
      item => item._id === product._id &&
              item.selectedSize === size &&
              item.selectedColor === color
    );

    if (existingIndex !== -1) {
      const newQty = items[existingIndex].selectedQuantity + selectedQuantity;
      if (newQty <= product.quantity) {
        items[existingIndex] = { ...items[existingIndex], selectedQuantity: newQty };
      } else {
        alert('Maximum quantity reached!');
        return;
      }
    } else {
      items.push({
        _id: product._id,
        title: product.title,
        price: product.price,
        priceAfterDiscount: product.priceAfterDiscount,
        imageCover: product.imageCover,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity,
        selectedQuantity,
        selectedSize: size,
        selectedColor: color
      });
    }

    this.cartItems.next(items);
    this.saveCartToStorage(items);
    this.updateCartCount();
  }

  // ─── Get cart from API ─────────────────────────────────────────
  getCartFromApi(): Observable<ApiCartResponse | null> {
    if (!this.isLoggedIn()) {
      console.warn('⚠️ Cannot fetch cart - user not logged in');
      return of(null);
    }

    return this.http.get<ApiCartResponse>(
      this.baseUrl,
      { headers: this.getHeaders() }
    ).pipe(
      tap(res => {
        console.log('📦 GET Cart Response:', res);
        if (res?.data?._id) {
          this.saveCartId(res.data._id);
        }
      }),
      catchError(err => {
        console.error('❌ Failed to fetch cart:', err);
        return of(null);
      })
    );
  }

  // ─── Ensure cartId exists (for checkout) ───────────────────────
ensureCartId(): Observable<string | null> {
  const existingId = this.getCartId();
  if (existingId) {
    console.log('✅ Using existing cartId:', existingId);
    return of(existingId);
  }

  if (!this.isLoggedIn()) {
    console.error('❌ User must be logged in to checkout');
    return of(null);
  }

  return this.http.get<ApiCartResponse>(
    this.baseUrl,
    { headers: this.getHeaders() }
  ).pipe(
    map(res => {
      const id = res?.data?._id || null;
      if (id) {
        this.saveCartId(id);
      }
      return id; // ← هنا بقى فعلاً بترجع string
    }),
    catchError(err => {
      console.error('❌ Failed to get cartId:', err);
      return of(null);
    })
  );
}


  // ─── Update quantity ───────────────────────────────────────────
  updateQuantity(itemId: string, size: string | undefined, color: string | undefined, quantity: number): void {
    const items = [...this.cartItems.value];
    const idx = items.findIndex(
      item => item._id === itemId && item.selectedSize === size && item.selectedColor === color
    );

    if (idx !== -1) {
      if (quantity <= 0) {
        items.splice(idx, 1);
      } else if (quantity <= items[idx].quantity) {
        items[idx] = { ...items[idx], selectedQuantity: quantity };
      } else {
        alert('Quantity exceeds available stock!');
        return;
      }
      this.cartItems.next(items);
      this.saveCartToStorage(items);
      this.updateCartCount();
    }
  }

  // ─── Remove from cart ──────────────────────────────────────────
  removeFromCart(itemId: string, size?: string, color?: string): void {
    const filtered = this.cartItems.value.filter(
      item => !(item._id === itemId && item.selectedSize === size && item.selectedColor === color)
    );
    this.cartItems.next(filtered);
    this.saveCartToStorage(filtered);
    this.updateCartCount();
  }

  // ─── Clear cart ────────────────────────────────────────────────
  clearCart(): void {
    this.cartItems.next([]);
    this.saveCartToStorage([]);
    localStorage.removeItem('cartId');
    this.cartId.next('');
    this.updateCartCount();
  }

  // ─── Getters ───────────────────────────────────────────────────
  getCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  getCartCount(): number {
    return this.cartCount.value;
  }

  getCartId(): string {
    return this.cartId.value || localStorage.getItem('cartId') || '';
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => {
      const price = item.priceAfterDiscount || item.price;
      return total + (price * item.selectedQuantity);
    }, 0);
  }

  getCartSubtotal(): number {
    return this.cartItems.value.reduce(
      (total, item) => total + (item.price * item.selectedQuantity), 0
    );
  }

  getTotalDiscount(): number {
    return this.getCartSubtotal() - this.getCartTotal();
  }
}