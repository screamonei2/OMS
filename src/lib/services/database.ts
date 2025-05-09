import { supabase } from '../supabase';
import type { Category, Client, Product, Order } from '../types/shared';

export const DatabaseService = {
  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Category[];
  },

  async saveCategory(category: Partial<Category>) {
    if (category.id) {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', category.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Clients
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Client[];
  },

  async saveClient(client: Partial<Client>) {
    if (client.id) {
      const { data, error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', client.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Product[];
  },

  async saveProduct(product: Partial<Product>) {
    if (product.id) {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', product.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Orders
  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients (
          id,
          name
        ),
        order_items (
          *,
          products (
            id,
            name
          )
        )
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Order[];
  },

  async saveOrder(order: Partial<Order>) {
    const { order_items, ...orderData } = order;
    
    if (order.id) {
      const { data, error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', order.id)
        .select()
        .single();
      
      if (error) throw error;

      if (order_items) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .upsert(
            order_items.map(item => ({
              ...item,
              order_id: data.id
            }))
          );
        
        if (itemsError) throw itemsError;
      }

      return data;
    } else {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (error) throw error;

      if (order_items) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(
            order_items.map(item => ({
              ...item,
              order_id: data.id
            }))
          );
        
        if (itemsError) throw itemsError;
      }

      return data;
    }
  },

  // Generic delete methods
  async deleteRecord(table: string, id: number) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteBulk(table: string, ids: number[]) {
    const { error } = await supabase
      .from(table)
      .delete()
      .in('id', ids);
    
    if (error) throw error;
  }
};