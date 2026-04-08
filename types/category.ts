export interface SubCategory {
  _id: string;
  name: string;
  category: string | Category;       // string when stored, populated when fetched
  position: number;
  createdAt?: Date;
}

export interface Category {
  _id: string;
  name: string;
  position: number,
  image: {
    url: string,
    public_id: string
  }
  createdAt?: Date;
}