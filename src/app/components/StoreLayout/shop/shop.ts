import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Product } from '../../../models/product';
import { ProductApi } from '../../../service/product-api';
import { ProductCardComponent } from '../card-producte/card-producte';
import { CartService } from '../../../service/cart';
import { WishlistService } from '../../../service/wishlist';
import Swal from 'sweetalert2';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ProductCardComponent],
  templateUrl: './shop.html',
  styleUrls: ['./shop.css'],
})
export class Shop implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  isLoading = false;

  // Filter States
  searchTerm = '';
  selectedCategory = 'all';
  selectedBrand = 'all';
  minPrice = 0;
  maxPrice = 50000;
  maxPriceFilter = 50000;

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 0;

  // Mobile
  showMobileFilters = false;

  categories: FilterOption[] = [
    { label: 'All Categories', value: 'all' },
    { label: "Women's Fashion", value: "Women's Fashion" },
    { label: "Men's Fashion", value: "Men's Fashion" },
    { label: 'Electronics', value: 'Electronics' },
  ];

  brands: FilterOption[] = [{ label: 'All Brands', value: 'all' }];

  constructor(
    private productApi: ProductApi,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private cartService: CartService,
    private wishlistService: WishlistService, // ✅ Added
  ) {}

  // ============================
  // INIT
  // ============================

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const categoryFromUrl = params['category'] ? decodeURIComponent(params['category']) : null;

      if (categoryFromUrl) {
        this.selectedCategory = categoryFromUrl;
      }

      this.loadProducts();
    });
  }

  // ============================
  // LOAD PRODUCTS
  // ============================

  loadProducts(): void {
    this.isLoading = true;

    this.productApi.getProducts().subscribe({
      next: (response) => {
        this.products = response.data.map((p) => ({
          ...p,
          inWishlist: this.wishlistService.isInWishlist(p._id), // ✅ Important
        }));

        this.filteredProducts = [...this.products];

        this.extractBrands();
        this.calculatePriceRange();
        this.updatePagination();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ============================
  // FILTERS
  // ============================

  extractBrands(): void {
    const uniqueBrands = new Set<string>();
    const productsToCheck =
      this.filteredProducts.length > 0 ? this.filteredProducts : this.products;

    productsToCheck.forEach((p) => {
      if (p.brand?.name) {
        uniqueBrands.add(p.brand.name);
      }
    });

    this.brands = [
      { label: 'All Brands', value: 'all' },
      ...Array.from(uniqueBrands)
        .sort()
        .map((brand) => ({
          label: brand,
          value: brand,
        })),
    ];
  }

  calculatePriceRange(): void {
    if (this.products.length === 0) return;

    const prices = this.products.map((p) => p.priceAfterDiscount || p.price);

    this.minPrice = Math.floor(Math.min(...prices));
    this.maxPrice = Math.ceil(Math.max(...prices));
    this.maxPriceFilter = this.maxPrice;
  }

  applyFilters(): void {
    let filtered = [...this.products];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) || p.category.name.toLowerCase().includes(search),
      );
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category.name === this.selectedCategory);
    }

    if (this.selectedBrand !== 'all') {
      filtered = filtered.filter((p) => p.brand.name === this.selectedBrand);
    }

    filtered = filtered.filter((p) => {
      const price = p.priceAfterDiscount || p.price;
      return price <= this.maxPriceFilter;
    });

    this.filteredProducts = filtered;
    this.currentPage = 1;

    this.extractBrands();
    this.updatePagination();
  }

  // ============================
  // PAGINATION
  // ============================

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ============================
  // CART
  // ============================


  // ============================
  // WISHLIST
  // ============================

  toggleWishlist(product: Product): void {
  const newState = this.wishlistService.toggleWishlist(product);
  product.inWishlist = newState;
  
  if (newState) {
    Swal.fire({ icon: 'success', title: `${product.title} added to wishlist!`, timer: 1500, showConfirmButton: false, width: '320px' });
  }
}

 addToCart(product: Product): void {
  this.cartService.addToCart(product, 1);
  Swal.fire({ icon: 'success', title: `${product.title} added to cart!`, timer: 1500, showConfirmButton: false, width: '320px' });
}

addToWishlist(product: Product): void {
  this.wishlistService.addToWishlist(product);
  product.inWishlist = true;
  Swal.fire({ icon: 'success', title: `${product.title} added to wishlist!`, timer: 1500, showConfirmButton: false, width: '320px' });
}


  // ============================
  // MOBILE
  // ============================

  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  onSearchChange(): void {
    this.applyFilters();
  }
  onCategoryChange(): void {
    this.applyFilters();
  }
  onBrandChange(): void {
    this.applyFilters();
  }
  onPriceChange(): void {
    this.applyFilters();
  }
}
