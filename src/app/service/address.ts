import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Address {
  _id?: string;
  name: string;
  details: string;
  phone: string;
  city: string;
}

export interface AddressResponse {
  status: string;
  message: string;
  numOfAddresses?: number;
  data: Address[];
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private baseUrl = 'https://ecommerce.routemisr.com/api/v1/addresses';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ token });
  }

  // GET all addresses
  getAddresses(): Observable<AddressResponse> {
    return this.http.get<AddressResponse>(this.baseUrl, {
      headers: this.getHeaders()
    });
  }

  // POST add address
  addAddress(address: Omit<Address, '_id'>): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(this.baseUrl, address, {
      headers: this.getHeaders()
    });
  }

  // DELETE remove address
  removeAddress(addressId: string): Observable<AddressResponse> {
    return this.http.delete<AddressResponse>(`${this.baseUrl}/${addressId}`, {
      headers: this.getHeaders()
    });
  }
}