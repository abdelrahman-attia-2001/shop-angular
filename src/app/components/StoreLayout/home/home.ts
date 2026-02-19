import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProductApi } from '../../../service/product-api';
import { Product } from '../../../models/product';
import { ProductCardComponent } from '../card-producte/card-producte';
import { CartService } from '../../../service/cart';
import { WishlistService } from '../../../service/wishlist';

interface HeroImage {
  url: string;
  alt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  categories = [
    { name: "Women's Fashion", url: '' },
    { name: "Men's Fashion", url: '' },
    { name: 'Electronics', url: '' },
  ];
  private _productApi = inject(ProductApi);
  private _router = inject(Router);

  constructor(
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private wishlistService: WishlistService,
  ) {}

  private destroy$ = new Subject<void>();

  // Products
  newArrivals: Product[] = [];
  topSelling: Product[] = [];

  // Loading states
  isLoadingNewArrivals = false;
  isLoadingTopSelling = false;

  // Newsletter
  newsletterEmail = '';

  // Hero Slider
  currentSlide = 0;
  autoPlayInterval: any;

  heroImages: HeroImage[] = [
    {
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      alt: 'Fashion models showcasing stylish clothing',
    },
    {
      url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
      alt: 'Trendy fashion collection',
    },
    {
      url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop',
      alt: 'Modern clothing style',
    },
  ];

  // ================= Lifecycle =================

  ngOnInit(): void {
    this.categories = this.categories.map((c) => ({ ...c, url: encodeURIComponent(c.name) }));
    this.startAutoPlay();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================= Slider =================

  startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.heroImages.length;
  }

  previousSlide(): void {
    this.currentSlide =
      this.currentSlide === 0 ? this.heroImages.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  // ================= Data =================

  loadAllData(): void {
    this.loadNewArrivals();
    this.loadTopSelling();
  }

  loadNewArrivals(): void {
    this.isLoadingNewArrivals = true;

    this._productApi
      .getNewArrivals()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.newArrivals = (res.data || []).map((p) => ({
            ...p,
            inWishlist: false,
          }));

          this.isLoadingNewArrivals = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading new arrivals:', err);
          this.isLoadingNewArrivals = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadTopSelling(): void {
    this.isLoadingTopSelling = true;

    this._productApi
      .getTopSellingProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.topSelling = (res.data || []).map((p) => ({
            ...p,
            inWishlist: false,
          }));

          this.isLoadingTopSelling = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading top selling:', err);
          this.isLoadingTopSelling = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ================= Actions =================

  toggleWishlist(product: Product): void {
    const newState = this.wishlistService.toggleWishlist(product);
    product.inWishlist = newState;
  }

  addToWishlist(product: Product): void {
    this.wishlistService.addToWishlist(product);
    product.inWishlist = true;
    alert(`${product.title} added to wishlist!`);
  }

  addToCart(product: Product): void {
    // Add to cart with default quantity = 1
    // No size/color selection in product cards
    this.cartService.addToCart(product, 1);

    console.log('Added to cart:', product.title);
    alert(`${product.title} added to cart!`);
  }

  subscribeNewsletter(): void {
    if (this.newsletterEmail && this.validateEmail(this.newsletterEmail)) {
      console.log('Newsletter subscription:', this.newsletterEmail);
      alert(`Thank you for subscribing with: ${this.newsletterEmail}`);
      this.newsletterEmail = '';
    } else {
      alert('Please enter a valid email address');
    }
  }

  // ================= Helpers =================

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  trackByProductId(index: number, product: Product): string {
    return product._id;
  }
}
