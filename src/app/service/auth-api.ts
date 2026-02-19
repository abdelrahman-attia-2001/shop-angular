import { Injectable , inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Signup } from '../models/signup';
import { Signin } from '../models/signin';
import { LoginResponse } from '../models/login-respons';


@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private _http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/auth/`;
  // ميثود التسجيل
  register(userData: object): Observable<Signup> {
    return this._http.post<Signup>(`${this.baseUrl}signup`, userData);
  }

  // ميثود تسجيل الدخول
login(data: Signin) {
  return this._http.post<LoginResponse>(`${this.baseUrl}signin`, data);
}
logout() {  // قم بحذف التوكن من التخزين المحلي
  localStorage.removeItem('token');
}

}