import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './components/AuthLayout/auth-layout-component/auth-layout-component';
import { Login } from './components/AuthLayout/login/login';
import { Register } from './components/AuthLayout/register/register';
import { StoreLayout } from './components/StoreLayout/store-layout/store-layout';
import { HomeComponent } from './components/StoreLayout/home/home';
import { authGuard } from './Guard/auth-guard-guard';
import { Shop } from './components/StoreLayout/shop/shop';
import { About } from './components/StoreLayout/about/about';
import { ProductDetailsComponent } from './components/StoreLayout/product-details/product-details';
import { CartComponent } from './components/StoreLayout/cart/cart';
import { WishlistComponent } from './components/StoreLayout/wishlist/wishlist';
import { CheckoutComponent } from './components/StoreLayout/checkout/checkout';
import { OrdersComponent } from '../app/components/StoreLayout/orders/orders';
import { AccountComponent } from './components/StoreLayout/account/account';

export const routes: Routes = [
  // 1. مسارات الـ Auth
  {
    path: 'SHOP.CO',
    title:'Authentication',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // 2. مسارات المتجر (Store)
  {
    path: '',
    title: 'SHOP.CO',
    component: StoreLayout,
    canActivate: [authGuard], // الحارس بتاعك عشان تتأكد إنه عامل login
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'shop', component: Shop },
      { path: 'shop/category/:category', component: Shop },
      { path: 'product/:id',component: ProductDetailsComponent},
      { path: 'about', component: About },
      { path: 'cart', component: CartComponent },
      { path: 'wishlist', component: WishlistComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'account', component: AccountComponent },

    ],
  },

  // لو دخل أي لينك غلط يوديه لـ 404 أو اللوجين
  { path: '**', redirectTo: 'auth' },
];
