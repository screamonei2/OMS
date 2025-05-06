export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          price: number
          stock: number
          category: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          stock: number
          category: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          stock?: number
          category?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: number
          name: string
          email: string
          phone: string
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          phone: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          phone?: string
          status?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          description: string
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          status?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          client_id: number
          total: number
          status: string
          date: string
          created_at: string
        }
        Insert: {
          id?: number
          client_id: number
          total: number
          status?: string
          date: string
          created_at?: string
        }
        Update: {
          id?: number
          client_id?: number
          total?: number
          status?: string
          date?: string
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
          price?: number
          created_at?: string
        }
      }
    }
  }
}