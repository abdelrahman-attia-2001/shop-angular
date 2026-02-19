import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';

export interface OrderItem {
  product: {
    _id: string;
    title: string;
    imageCover: string;
    brand: { name: string };
    category: { name: string };
  };
  count: number;
  price: number;
  _id: string;
  color: string;
}

export interface ApiOrder {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  cartItems: OrderItem[];
  shippingAddress: {
    details: string;
    phone: string;
    city: string;
  };
  taxPrice: number;
  shippingPrice: number;
  totalOrderPrice: number;
  paymentMethodType: 'cash' | 'card';
  isPaid: boolean;
  isDelivered: boolean;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersApiResponse {
  results: number;
  paginationResult: {
    currentPage: number;
    numberOfPages: number;
  };
  data: ApiOrder[];
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private http = inject(HttpClient);
  private baseUrl = 'https://ecommerce.routemisr.com/api/v1/orders';

  private ordersSubject = new BehaviorSubject<ApiOrder[]>([]);
  orders$ = this.ordersSubject.asObservable();

  // ✅ إصلاح الـ authentication header
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('userToken') || '';
    console.log('🔑 OrdersService Token:', token ? 'exists' : 'missing');
    
    if (!token) {
      console.warn('⚠️ No token found for orders API!');
    }
    
    return new HttpHeaders({ token });
  }

  // ✅ تحسين getUserOrders مع error handling أفضل
  getUserOrders(userId: string): Observable<ApiOrder[]> {
    console.log('📋 Fetching orders for user:', userId);
    
    if (!userId) {
      console.error('❌ User ID is required');
      return of([]);
    }

    return this.http.get<ApiOrder[]>(
      `${this.baseUrl}/user/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(orders => {
        console.log('✅ Orders fetched:', orders?.length || 0);
        this.ordersSubject.next(orders || []);
      }),
      catchError(err => {
        console.error('❌ Failed to fetch orders:', err);
        
        if (err.status === 401) {
          console.warn('⚠️ Unauthorized - invalid token');
        } else if (err.status === 404) {
          console.warn('⚠️ No orders found for user');
        }
        
        this.ordersSubject.next([]);
        return of([]);
      })
    );
  }

  // ✅ Method جديدة لـ refresh الـ orders
  refreshOrders(userId: string): void {
    this.getUserOrders(userId).subscribe();
  }

  // GET all orders (for internal use / admin)
  getOrders(): Observable<OrdersApiResponse> {
    return this.http.get<OrdersApiResponse>(
      this.baseUrl,
      { headers: this.getHeaders() }
    );
  }

  // Helper getters
  get currentOrders(): ApiOrder[] {
    return this.ordersSubject.value;
  }

  getOrderById(id: string): ApiOrder | undefined {
    return this.ordersSubject.value.find(o => o._id === id);
  }

  // ✅ Clear orders (for logout)
  clearOrders(): void {
    this.ordersSubject.next([]);
  }
}