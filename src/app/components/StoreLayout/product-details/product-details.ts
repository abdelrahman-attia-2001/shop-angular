import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ProductApi } from '../../../service/product-api';
import { Product } from '../../../models/product';
import { ProductCardComponent } from '../card-producte/card-producte';
import { CartService } from '../../../service/cart';
import { WishlistService } from '../../../service/wishlist';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ProductCardComponent],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css'],
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  product!: Product;
  relatedProducts: Product[] = [];

  isLoading = false;
  isLoadingRelated = false;

  // Image Gallery
  selectedImage = '';
  currentImageIndex = 0;

  // Product Options
  selectedSize = '';
  selectedColor = '';
  quantity = 1;

  // Available Options
  availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  availableColors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Navy', value: '#1E3A8A' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Beige', value: '#D4C5B9' },
  ];

  // Reviews
  showAllReviews = false;
  reviewsToShow = 3;

  private swalOptions = {
    timer: 1500,
    showConfirmButton: false,
    width: '320px',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productApi: ProductApi,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private wishlistService: WishlistService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(id: string): void {
    this.isLoading = true;

    this.productApi
      .getProductById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.product = { ...response.data, inWishlist: false };

          this.selectedImage = this.product.imageCover;
          this.currentImageIndex = 0;

          if (this.availableSizes.length > 0) {
            this.selectedSize = this.availableSizes[2];
          }
          if (this.availableColors.length > 0) {
            this.selectedColor = this.availableColors[0].name;
          }

          if (this.product.category?._id) {
            this.loadRelatedProducts(this.product.category._id);
          }

          this.isLoading = false;
          this.cdr.detectChanges();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          console.error('Error loading product:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadRelatedProducts(categoryId: string): void {
    this.isLoadingRelated = true;

    this.productApi
      .getProductsByCategory(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.relatedProducts = response.data
            .filter((p) => p._id !== this.product?._id)
            .slice(0, 4)
            .map((p) => ({ ...p, inWishlist: false }));

          this.isLoadingRelated = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading related products:', err);
          this.isLoadingRelated = false;
          this.cdr.detectChanges();
        },
      });
  }

  // Image Gallery Methods
  selectImage(image: string, index: number): void {
    this.selectedImage = image;
    this.currentImageIndex = index;
  }

  nextImage(): void {
    if (!this.product) return;
    const images = this.getAllImages();
    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
    this.selectedImage = images[this.currentImageIndex];
  }

  previousImage(): void {
    if (!this.product) return;
    const images = this.getAllImages();
    this.currentImageIndex =
      this.currentImageIndex === 0 ? images.length - 1 : this.currentImageIndex - 1;
    this.selectedImage = images[this.currentImageIndex];
  }

  getAllImages(): string[] {
    if (!this.product) return [];
    return [this.product.imageCover, ...(this.product.images || [])];
  }

  // Product Options Methods
  selectSize(size: string): void {
    this.selectedSize = size;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.quantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // Actions
  toggleWishlist(product: Product): void {
  const newState = this.wishlistService.toggleWishlist(product);
  product.inWishlist = newState;
  
  if (newState) {
    Swal.fire({ icon: 'success', title: `${product.title} added to wishlist!`, timer: 1500, showConfirmButton: false, width: '320px' });
  }
}

  addToWishlist(product: Product): void {
    this.wishlistService.addToWishlist(product);
    product.inWishlist = true;
    Swal.fire({ ...this.swalOptions, icon: 'success', title: `${product.title} added to wishlist!` });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    Swal.fire({ ...this.swalOptions, icon: 'success', title: `${product.title} added to cart!` });
  }

  buyNow(): void {
    this.cartService.addToCart(this.product, this.quantity, this.selectedSize, this.selectedColor);
    this.router.navigate(['/checkout']);
  }

  // Related Products Actions
  handleWishlistToggle(product: Product): void {
    product.inWishlist = !product.inWishlist;
  }

  handleAddToCart(product: Product): void {
    Swal.fire({ ...this.swalOptions, icon: 'success', title: `${product.title} added to cart!` });
  }

  // Reviews
  toggleReviews(): void {
    this.showAllReviews = !this.showAllReviews;
  }

  getDisplayedReviews(): any[] {
    if (!this.product?.reviews) return [];
    return this.showAllReviews
      ? this.product.reviews
      : this.product.reviews.slice(0, this.reviewsToShow);
  }

  // Helpers
  getDiscountPercentage(): number {
    if (!this.product?.priceAfterDiscount) return 0;
    return Math.round(
      ((this.product.price - this.product.priceAfterDiscount) / this.product.price) * 100,
    );
  }

  getRatingStars(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  trackByProductId(index: number, product: Product): string {
    return product._id;
  }
}