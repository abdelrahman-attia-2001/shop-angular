import { Component, inject } from '@angular/core';
import { AuthApi } from '../../../service/auth-api';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../service/user-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private _authApi = inject(AuthApi);
  private _router = inject(Router);
  private _userService = inject(UserService); // حقن خدمة المستخدم

  // التحكم في الحالة
  showPassword = false;
  showConfirmPassword = false;
  agreedToTerms = false;
  isLoading = false; // لمتابعة حالة الطلب
  serverError: string | null = null; // لعرض أخطاء الـ API

  registerForm: FormGroup = new FormGroup({
    name: new FormControl(null, [
      Validators.required, 
      Validators.minLength(3)
    ]),
    email: new FormControl(null, [
      Validators.required, 
      Validators.email
    ]),
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(6)
    ]),
    rePassword: new FormControl(null, [
      Validators.required
    ]),
    phone: new FormControl(null, [
      Validators.required, 
      Validators.pattern(/^01[0125][0-9]{8}$/)
    ]),
  });

submitRegister() {
    // ... الكود السابق الخاص بالتحقق
    
    if (this.registerForm.valid && this.agreedToTerms) {
      this.isLoading = true;
      
      this._authApi.register(this.registerForm.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          
          // حفظ بيانات الفورم في الخدمة قبل الانتقال
          // ندمج بيانات الفورم مع الاستجابة القادمة من السيرفر إذا أردت
          this._userService.setUserData(this.registerForm.value);

          this._router.navigate(['/login']);
        },
        error: (err) => { /* ... */ }
      });
    }
  }
}