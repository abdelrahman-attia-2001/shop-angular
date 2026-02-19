export interface WishlistItem {
  _id: string;
  title: string;
  price: number;
  priceAfterDiscount?: number;
  imageCover: string;
  category: {
    _id: string;
    name: string;
  };
  brand?: {
    _id: string;
    name: string;
  };
  ratingsAverage: number;
  ratingsQuantity: number;
  quantity: number;
  inWishlist: boolean;
}
