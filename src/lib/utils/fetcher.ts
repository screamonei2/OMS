import supabase from '../supabaseClient';

export const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      client_id, 
      total, 
      status, 
      date,
      order_items:order_items(*)
    `);

  if (error) {
    console.error('Error fetching orders:', error);
    return null;
  }

  return data;
};

export const saveOrder = async (order: { client_id: number; order_items: any; total: number; status: string; date: string }) => {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id: order.client_id,
      total: order.total,
      status: order.status,
      date: order.date
    })
    .select('id')
    .single();

  if (orderError) {
    console.error('Error saving order:', orderError);
    return null;
  }

  const orderItems = order.order_items.map(item => ({
    order_id: orderData.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error saving order items:', itemsError);
    return null;
  }

  return orderData;
};
