import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WishlistItem } from '../models/wishlist-item';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistItems = new BehaviorSubject<WishlistItem[]>(this.loadWishlistFromStorage());
  private wishlistCount = new BehaviorSubject<number>(0);

  wishlistItems$ = this.wishlistItems.asObservable();
  wishlistCount$ = this.wishlistCount.asObservable();

  constructor() {
    this.updateWishlistCount();
  }

  // Load wishlist from localStorage
  private loadWishlistFromStorage(): WishlistItem[] {
    const wishlist = localStorage.getItem('wishlist');
    return wishlist ? JSON.parse(wishlist) : [];
  }

  // Save wishlist to localStorage
  private saveWishlistToStorage(items: WishlistItem[]): void {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }

  // Update wishlist count
  private updateWishlistCount(): void {
    const items = this.wishlistItems.value;
    this.wishlistCount.next(items.length);
  }

  // Get all wishlist items
  getWishlistItems(): WishlistItem[] {
    return this.wishlistItems.value;
  }

  // Get wishlist count
  getWishlistCount(): number {
    return this.wishlistCount.value;
  }

  // Check if product is in wishlist
  isInWishlist(productId: string): boolean {
    return this.wishlistItems.value.some(item => item._id === productId);
  }

  // Add item to wishlist
  addToWishlist(product: any): void {
    const items = this.wishlistItems.value;
    
    // Check if item already exists
    const existingItem = items.find(item => item._id === product._id);
    
    if (!existingItem) {
      const wishlistItem: WishlistItem = {
        _id: product._id,
        title: product.title,
        price: product.price,
        priceAfterDiscount: product.priceAfterDiscount,
        imageCover: product.imageCover,
        category: product.category,
        brand: product.brand,
        ratingsAverage: product.ratingsAverage,
        ratingsQuantity: product.ratingsQuantity,
        quantity: product.quantity,
        inWishlist: true
      };
      
      items.push(wishlistItem);
      
      this.wishlistItems.next(items);
      this.saveWishlistToStorage(items);
      this.updateWishlistCount();
    }
  }

  // Remove item from wishlist
  removeFromWishlist(productId: string): void {
    const items = this.wishlistItems.value;
    const filteredItems = items.filter(item => item._id !== productId);

    this.wishlistItems.next(filteredItems);
    this.saveWishlistToStorage(filteredItems);
    this.updateWishlistCount();
  }

  // Toggle wishlist (add if not exists, remove if exists)
  toggleWishlist(product: any): boolean {
    const isInWishlist = this.isInWishlist(product._id);
    
    if (isInWishlist) {
      this.removeFromWishlist(product._id);
      return false;
    } else {
      this.addToWishlist(product);
      return true;
    }
  }

  // Clear entire wishlist
  clearWishlist(): void {
    this.wishlistItems.next([]);
    this.saveWishlistToStorage([]);
    this.updateWishlistCount();
  }

  // Move item to cart (will be used with CartService)
  moveToCart(productId: string): WishlistItem | null {
    const items = this.wishlistItems.value;
    const item = items.find(i => i._id === productId);
    
    if (item) {
      this.removeFromWishlist(productId);
      return item;
    }
    
    return null;
  }
}