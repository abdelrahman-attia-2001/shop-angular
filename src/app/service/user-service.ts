import { Injectable, signal } from '@angular/core';
import { Signup } from '../models/signup';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // استخدام Signal (أحدث ميزة في أنجلر) لتخزين البيانات وسهولة الوصول إليها
  currentUser = signal<Signup | null>(null);

  // دالة لحفظ البيانات
  setUserData(data: Signup) {
    this.currentUser.set(data);
    // اختياري: حفظها في LocalStorage لتبقى موجودة حتى بعد عمل Refresh
    localStorage.setItem('user_info', JSON.stringify(data));
  }

  // دالة لاسترجاع البيانات
  getUserData() {
    if (!this.currentUser()) {
      const saved = localStorage.getItem('user_info');
      if (saved) this.currentUser.set(JSON.parse(saved));
    }
    return this.currentUser();
  }
}