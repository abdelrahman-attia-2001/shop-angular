
export interface CartItem {
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
  quantity: number; // الكمية المتاحة
  selectedQuantity: number; // الكمية المختارة
  selectedSize?: string;
  selectedColor?: string;
}