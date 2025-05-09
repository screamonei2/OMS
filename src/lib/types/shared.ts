export interface BaseEntity {
  id: number;
  created_at: string;
}

export interface Category extends BaseEntity {
  name: string;
  description: string;
  status: string;
}

export interface Client extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  status: string;
}

export interface Product extends BaseEntity {
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  products?: {
    id: number;
    name: string;
  };
}

export interface Order extends BaseEntity {
  client_id: number;
  order_items: OrderItem[];
  total: number;
  status: string;
  date: string;
  clients?: {
    id: number;
    name: string;
  };
}

export type Status = 'Ativo' | 'Inativo' | 'Pendente' | 'Em Processamento' | 'Enviado' | 'Entregue' | 'Cancelado';