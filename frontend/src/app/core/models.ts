export interface User {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  faculty: string;
  role: string;
  balance: number;
  purchaseHistory: Purchase[];
}

export interface Purchase {
  listingId: string;
  title: string;
  price: number;
  sellerName: string;
  purchasedAt: string;
}

export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  sellerName: string;
  imageUrl: string | null;
  user: string | null;
  status: 'available' | 'reserved' | 'sold';
  createdAt: string;
}
