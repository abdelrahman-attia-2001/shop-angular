import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-card-producte',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './card-producte.html',
  styleUrls: ['./card-producte.css']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() wishlistToggle = new EventEmitter<Product>();
  @Output() addToCartClick = new EventEmitter<Product>();

  onToggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlistToggle.emit(this.product);
  }

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCartClick.emit(this.product);
  }
}