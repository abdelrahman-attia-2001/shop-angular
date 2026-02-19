import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OrdersService, ApiOrder } from '../../../service/orders';
import { UserService } from '../../../service/user-service';

type OrderFilter = 'all' | 'cash' | 'card' | 'paid' | 'unpaid' | 'delivered';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {
  private ordersApi = inject(OrdersService);
  private userService = inject(UserService);
  private router = inject(Router);

  orders = signal<ApiOrder[]>([]);
  filteredOrders = signal<ApiOrder[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedFilter: OrderFilter = 'all';
  filters: OrderFilter[] = ['all', 'cash', 'card', 'paid', 'unpaid', 'delivered'];
  expandedOrderId: string | null = null;

  ngOnInit(): void {
    const ok = this.checkAuthentication();
    if (!ok) return;
    this.loadOrders();
  }

  private checkAuthentication(): boolean {
    const token = localStorage.getItem('userToken');
    if (!token) {
      console.warn('⚠️ No token found, redirecting to login');
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/orders' } 
      });
      return false;
    }
    return true;
  }

  private getUserId(): string | null {
    // 1) من الـ service
    const user = this.userService.getUserData();
    if (user?._id) return user._id;

    // 2) من localStorage
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?._id) return parsed._id;
      }
    } catch { /* ignore */ }

    // 3) من التوكن (JWT decode)
    const token = localStorage.getItem('userToken');
    if (token) {
      const id = this.decodeUserIdFromToken(token);
      if (id) return id;
    }

    return null;
  }

  private decodeUserIdFromToken(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(json);
      return data?._id || data?.id || data?.userId || null;
    } catch {
      return null;
    }
  }

  loadOrders(): void {
    console.log('🔄 Loading orders...');

    const userId = this.getUserId();
    console.log('👤 User ID:', userId);

    if (!userId) {
      console.error('❌ No user ID found');
      this.errorMessage.set('Please log in to view your orders.');
      this.isLoading.set(false);
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/orders' } 
      });
      return;
    }

    console.log('📋 Fetching orders for user ID:', userId);

    this.ordersApi.getUserOrders(userId).subscribe({
      next: (orders: ApiOrder[]) => {
        console.log('✅ Orders received:', orders);
        
        if (!orders || orders.length === 0) {
          console.warn('⚠️ No orders found');
          this.errorMessage.set('You have no orders yet. Start shopping!');
        } else {
          this.errorMessage.set(null);
        }
        
        this.orders.set(orders || []);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Orders API Error:', err);
        this.isLoading.set(false);
        
        if (err.status === 401) {
          this.errorMessage.set('Session expired. Please login again.');
          this.router.navigate(['/login']);
        } else if (err.status === 404) {
          this.errorMessage.set('You have no orders yet. Start shopping!');
        } else {
          this.errorMessage.set('Failed to load orders. Please try again.');
        }
      }
    });
  }

  refreshOrders(): void {
    this.isLoading.set(true);
    this.loadOrders();
  }

  applyFilter(): void {
    const all = this.orders();

    switch (this.selectedFilter) {
      case 'cash':
        this.filteredOrders.set(all.filter((o: ApiOrder) => o.paymentMethodType === 'cash'));
        break;
      case 'card':
        this.filteredOrders.set(all.filter((o: ApiOrder) => o.paymentMethodType === 'card'));
        break;
      case 'paid':
        this.filteredOrders.set(all.filter((o: ApiOrder) => o.isPaid));
        break;
      case 'unpaid':
        this.filteredOrders.set(all.filter((o: ApiOrder) => !o.isPaid));
        break;
      case 'delivered':
        this.filteredOrders.set(all.filter((o: ApiOrder) => o.isDelivered));
        break;
      default:
        this.filteredOrders.set(all);
    }
  }

  changeFilter(f: OrderFilter): void {
    this.selectedFilter = f;
    this.applyFilter();
  }

  toggleExpand(id: string): void {
    this.expandedOrderId = this.expandedOrderId === id ? null : id;
  }

  isExpanded(id: string): boolean {
    return this.expandedOrderId === id;
  }

  getStatus(order: ApiOrder) {
    if (order.isDelivered) return { label: 'Delivered', color: 'bg-green-500 text-white' };
    if (order.isPaid) return { label: 'Paid', color: 'bg-blue-500 text-white' };
    return { label: 'Pending', color: 'bg-yellow-500 text-black' };
  }

  getPaymentIcon(type: string): string {
    return type === 'cash' ? '💵' : '💳';
  }

  getTotalItems(order: ApiOrder): number {
    return order.cartItems.reduce((sum, item) => sum + item.count, 0);
  }

  getTotalOrders(): number { 
    return this.orders().length; 
  }

  getTotalSpent(): number {
    return this.orders().reduce((sum, o) => sum + o.totalOrderPrice, 0);
  }

  getPaidCount(): number {
    return this.orders().filter(o => o.isPaid).length;
  }

  getDeliveredCount(): number {
    return this.orders().filter(o => o.isDelivered).length;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  }

  goToShop(): void {
    this.router.navigate(['/shop']);
  }

  trackById(_: number, order: ApiOrder): string {
    return order._id;
  }
}