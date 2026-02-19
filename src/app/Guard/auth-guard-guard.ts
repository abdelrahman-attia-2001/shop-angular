import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const _router = inject(Router);

  // بنشوف هل اليوزر عنده Token في المتصفح ولا لا
  if (localStorage.getItem('userToken') !== null) {
    return true; // مسموح له يدخل
  } else {
    // مش عامل Login؟ وديه لصفحة اللوجين
    _router.navigate(['/auth/login']);
    return false;
  }
};