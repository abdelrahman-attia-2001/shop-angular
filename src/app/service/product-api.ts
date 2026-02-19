import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductApi {
  constructor(private _http: HttpClient) {}
  
  private baseUrl = `${environment.baseUrl}/products`;
  private categoryUrl = `${environment.baseUrl}/categories`;

  // 1. جلب كل المنتجات (العادي)
  getProducts(): Observable<{ data: Product[] }> {
    return this._http.get<{ data: Product[] }>(this.baseUrl);
  }

  // 2. جلب منتج واحد بالـ ID
  getProductById(productId: string): Observable<{ data: Product }> {
    return this._http.get<{ data: Product }>(`${this.baseUrl}/${productId}`);
  }

  // 3. جلب "الأكثر مبيعاً" (Top Selling)
  getTopSellingProducts(): Observable<{ data: Product[] }> {
    return this._http.get<{ data: Product[] }>(`${this.baseUrl}?sort=-sold&limit=4`);
  }

  // 4. جلب "وصل حديثاً" (New Arrivals)
  getNewArrivals(): Observable<{ data: Product[] }> {
    return this._http.get<{ data: Product[] }>(`${this.baseUrl}?sort=-createdAt&limit=4`);
  }

  // 5. جلب التصنيفات (Categories)
  getCategories(): Observable<{ data: any[] }> {
    return this._http.get<{ data: any[] }>(this.categoryUrl);
  }

  // 6. جلب منتجات تصنيف معين
  getProductsByCategory(categoryId: string): Observable<{ data: Product[] }> {
    return this._http.get<{ data: Product[] }>(`${this.baseUrl}?category[in]=${categoryId}`);
  }
}