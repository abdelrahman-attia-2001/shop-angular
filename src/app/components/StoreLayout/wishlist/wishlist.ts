import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { WishlistService } from '../../../service/wishlist';
import { CartService } from '../../../service/cart';
import { ProductCardComponent } from '../card-producte/card-producte';
import { WishlistItem } from '../../../models/wishlist-item';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ProductCardComponent],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css'],
})
export class WishlistComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  wishlistItems: WishlistItem[] = [];

  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'newest' | 'price-low' | 'price-high' | 'name' = 'newest';

  private swalConfirmOptions = {
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    width: '320px',
  };

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWishlist(): void {
    this.wishlistService.wishlistItems$.pipe(takeUntil(this.destroy$)).subscribe((items) => {
      this.wishlistItems = items;
      this.applySorting();
    });
  }

  applySorting(): void {
    switch (this.sortBy) {
      case 'newest':
        break;
      case 'price-low':
        this.wishlistItems.sort((a, b) => {
          const priceA = a.priceAfterDiscount || a.price;
          const priceB = b.priceAfterDiscount || b.price;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        this.wishlistItems.sort((a, b) => {
          const priceA = a.priceAfterDiscount || a.price;
          const priceB = b.priceAfterDiscount || b.price;
          return priceB - priceA;
        });
        break;
      case 'name':
        this.wishlistItems.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  changeSortBy(sort: 'newest' | 'price-low' | 'price-high' | 'name'): void {
    this.sortBy = sort;
    this.applySorting();
  }

  removeFromWishlist(item: WishlistItem): void {
    Swal.fire({
      ...this.swalConfirmOptions,
      icon: 'warning',
      title: `Remove ${item.title}?`,
      text: 'This item will be removed from your wishlist',
      confirmButtonText: 'Remove',
      cancelButtonText: 'Keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        this.wishlistService.removeFromWishlist(item._id);
      }
    });
  }

  moveToCart(item: WishlistItem): void {
    this.cartService.addToCart(item, 1);
    this.wishlistService.removeFromWishlist(item._id);
    Swal.fire({
      icon: 'success',
      title: `${item.title} moved to cart!`,
      timer: 1500,
      showConfirmButton: false,
      width: '320px',
    });
  }

  moveAllToCart(): void {
    if (this.wishlistItems.length === 0) return;

    Swal.fire({
      ...this.swalConfirmOptions,
      icon: 'warning',
      title: `Move all ${this.wishlistItems.length} items to cart?`,
      confirmButtonText: 'Yes, move all',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#09C83C', // لون زرار التأكيد
      cancelButtonColor: '#d33', // لون زرار الإلغاء
    }).then((result) => {
      if (result.isConfirmed) {
        this.wishlistItems.forEach((item) => this.cartService.addToCart(item, 1));
        this.wishlistService.clearWishlist();
        Swal.fire({
          icon: 'success',
          title: 'All items moved to cart!',
          timer: 1500,
          showConfirmButton: false,
          width: '320px',
        });
      }
    });
  }

  clearWishlist(): void {
    Swal.fire({
      ...this.swalConfirmOptions,
      icon: 'warning',
      title: 'Clear entire wishlist?',
      text: 'All items will be removed',
      confirmButtonText: 'Yes, clear',
      cancelButtonText: 'Cancel',
      
    }).then((result) => {
      if (result.isConfirmed) {
        this.wishlistService.clearWishlist();
      }
    });
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  getItemPrice(item: WishlistItem): number {
    return item.priceAfterDiscount || item.price;
  }

  getDiscountPercentage(item: WishlistItem): number {
    if (!item.priceAfterDiscount) return 0;
    return Math.round(((item.price - item.priceAfterDiscount) / item.price) * 100);
  }

  getTotalSavings(): number {
    return this.wishlistItems.reduce((total, item) => {
      if (item.priceAfterDiscount) {
        return total + (item.price - item.priceAfterDiscount);
      }
      return total;
    }, 0);
  }

  getTotalValue(): number {
    return this.wishlistItems.reduce((total, item) => {
      return total + this.getItemPrice(item);
    }, 0);
  }

  handleWishlistToggle(product: WishlistItem): void {
    this.removeFromWishlist(product);
  }

  handleAddToCart(product: WishlistItem): void {
    this.moveToCart(product);
  }

  trackByProductId(index: number, item: WishlistItem): string {
    return item._id;
  }
}
