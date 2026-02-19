import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ShippingAddress {
  details: string;
  phone: string;
  city: string;
}

export interface CashOrderResponse {
  status: string;
  data: {
    _id: string;
    shippingAddress: ShippingAddress;
    taxPrice: number;
    shippingPrice: number;
    totalOrderPrice: number;
    paymentMethodType: string;
    isPaid: boolean;
    isDelivered: boolean;
    createdAt: string;
    cartItems: any[];
  };
}

export interface OnlineSessionResponse {
  status: string;
  session: {
    url: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutApiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://ecommerce.routemisr.com/api/v1/orders';

  // ✅ إصلاح الـ token key
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('userToken') || '';
    console.log('🔑 Token exists:', !!token);
    
    if (!token) {
      console.warn('⚠️ No token found!');
    }
    
    return new HttpHeaders({ token });
  }

  // ✅ تحسين error handling
  createCashOrder(cartId: string, shippingAddress: ShippingAddress): Observable<CashOrderResponse> {
    console.log('🛒 Creating cash order:', { cartId, shippingAddress });
    
    return this.http.post<CashOrderResponse>(
      `${this.baseUrl}/${cartId}`,
      { shippingAddress },
      { headers: this.getHeaders() }
    );
  }

  createOnlineSession(cartId: string, shippingAddress: ShippingAddress): Observable<OnlineSessionResponse> {
    console.log('💳 Creating online session:', { cartId, shippingAddress });
    
    const returnUrl = window.location.origin + '/orders'; // ✅ إضافة صفحة النتيجة
    
    return this.http.post<OnlineSessionResponse>(
      `${this.baseUrl}/checkout-session/${cartId}?url=${returnUrl}`,
      { shippingAddress },
      { headers: this.getHeaders() }
    );
  }

  // ✅ method جديدة للتحقق من الـ authentication
  isAuthenticated(): boolean {
    const token = localStorage.getItem('userToken');
    return !!token && token.length > 0;
  }
}