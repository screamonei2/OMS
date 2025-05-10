import { supabase } from '../lib/supabase';

async function seedOrders() {
    console.log('Inserting orders...');
    
    // First, get all client IDs
    const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .order('id');
        
    if (!clients?.length) {
        console.error('No clients found');
        return;
    }
    
    // Then, get all product IDs
    const { data: products } = await supabase
        .from('products')
        .select('id, price')
        .order('id');
        
    if (!products?.length) {
        console.error('No products found');
        return;
    }
    
    for (const client of clients) {
        // Select two random products
        const product1 = products[Math.floor(Math.random() * products.length)];
        const product2 = products[Math.floor(Math.random() * products.length)];
        
        const quantity1 = Math.floor(Math.random() * 3) + 1;
        const quantity2 = Math.floor(Math.random() * 3) + 1;
        
        const total = (product1.price * quantity1) + (product2.price * quantity2);
        const date = new Date(2025, 4, Math.floor(Math.random() * 20) + 1); // Random day in May 2025
        const statuses = ['Pendente', 'Processando', 'Entregue', 'Cancelado'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                client_id: client.id,
                total,
                status,
                date: date.toISOString().split('T')[0]
            }])
            .select()
            .single();
        
        if (orderError) {
            console.error(`Error creating order for client ${client.id}:`, orderError);
            continue;
        }
        
        // Create order items
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert([
                {
                    order_id: order.id,
                    product_id: product1.id,
                    quantity: quantity1,
                    price: product1.price
                },
                {
                    order_id: order.id,
                    product_id: product2.id,
                    quantity: quantity2,
                    price: product2.price
                }
            ]);
            
        if (itemsError) {
            console.error(`Error creating order items for order ${order.id}:`, itemsError);
        } else {
            console.log(`Created order ${order.id} for client ${client.id}`);
        }
    }
    
    console.log('Orders seed completed successfully!');
}

seedOrders().catch(console.error);
