import { Component, inject, OnInit } from '@angular/core';
import { AuthApi } from '../../../service/auth-api';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private _authApi = inject(AuthApi);
  private _router = inject(Router);

  showPassword = false;
  rememberMe = false;
  isLoading = false; // حالة التحميل
  errorMessage: string = '';

  loginForm: FormGroup = new FormGroup({
    email: new FormControl(null, [
      Validators.required, 
      Validators.email
    ]),
    password: new FormControl(null, [
      Validators.required,
      // تم تبسيط النمط ليكون 6 أحرف على الأقل لضمان عمل الزرار مع أغلب الباسوردات
      Validators.minLength(6) 
    ]),
    
  });

  ngOnInit() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail });
      this.rememberMe = true;
    }
  }

  submitLogin() {
    this.errorMessage = '';

    if (this.loginForm.valid) {
      this.isLoading = true; // تشغيل الـ Spinner
      
      this._authApi.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          localStorage.setItem('userToken', res.token);
          
          if (this.rememberMe) {
            localStorage.setItem('rememberedEmail', this.loginForm.value.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          
          this._router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Login error:', err);
          this.errorMessage = err.error?.message || 'Invalid email or password.';
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}