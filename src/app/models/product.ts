
import{ Review } from './review';
export interface Product {
  _id: string;
  title: string;

  description: string;          // ✅ أضف ده

  price: number;
  priceAfterDiscount?: number;

  imageCover: string;
  images?: string[];            // ✅ أضف ده

  category: {
    _id: string;
    name: string;
    slug: string;
  };

  brand: {
    _id: string;
    name: string;
    slug: string;
  };

  ratingsAverage: number;
  ratingsQuantity: number;

  sold: number;
  quantity: number;

  reviews?: Review[];           // ✅ أضف ده

  inWishlist?: boolean;
  inCart?: boolean;
}
