import supabase from '../supabaseClient';

export const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('client_id, order_items, total, status, date');

  if (error) {
    console.error('Error fetching orders:', error);
    return null;
  }

  return data;
};

export const saveOrder = async (order: { client_id: number; order_items: any; total: number; status: string; date: string }) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([order]);

  if (error) {
    console.error('Error saving order:', error);
    return null;
  }

  return data;
};
