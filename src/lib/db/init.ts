import { supabase } from '../supabase';

export async function initializeDatabase() {
  // Insert initial categories
  const { error: categoriesError } = await supabase.from('categories').upsert([
    {
      name: 'Produtos',
      description: 'Categorias de produtos variados',
      status: 'Ativo',
    },
    {
      name: 'Serviços',
      description: 'Categorias de serviços prestados',
      status: 'Ativo',
    },
    {
      name: 'Assinaturas',
      description: 'Categorias de planos de assinatura',
      status: 'Inativo',
    },
  ]);

  if (categoriesError) {
    console.error('Error inserting categories:', categoriesError);
    return;
  }

  // Insert initial clients
  const { error: clientsError } = await supabase.from('clients').upsert([
    {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 91234-5678',
      status: 'Ativo',
    },
    {
      name: 'Maria Souza',
      email: 'maria@email.com',
      phone: '(21) 99876-5432',
      status: 'Inativo',
    },
    {
      name: 'Carlos Oliveira',
      email: 'carlos@email.com',
      phone: '(31) 98765-4321',
      status: 'Ativo',
    },
  ]);

  if (clientsError) {
    console.error('Error inserting clients:', clientsError);
    return;
  }

  // Insert initial products
  const { error: productsError } = await supabase.from('products').upsert([
    {
      name: 'Produto A',
      price: 19.99,
      stock: 100,
      category: 'Eletrônicos',
    },
    {
      name: 'Produto B',
      price: 29.99,
      stock: 50,
      category: 'Roupas',
    },
    {
      name: 'Produto C',
      price: 9.99,
      stock: 200,
      category: 'Alimentos',
    },
  ]);

  if (productsError) {
    console.error('Error inserting products:', productsError);
    return;
  }

  // Get the first client and product for the sample order
  const { data: firstClient } = await supabase
    .from('clients')
    .select('id')
    .limit(1)
    .single();

  const { data: firstProduct } = await supabase
    .from('products')
    .select('id, price')
    .limit(1)
    .single();

  if (firstClient && firstProduct) {
    // Insert a sample order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .upsert([
        {
          client_id: firstClient.id,
          total: firstProduct.price * 2,
          status: 'Pendente',
          date: new Date().toISOString().split('T')[0],
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Error inserting order:', orderError);
      return;
    }

    // Insert order items
    if (order) {
      const { error: orderItemsError } = await supabase.from('order_items').upsert([
        {
          order_id: order.id,
          product_id: firstProduct.id,
          quantity: 2,
          price: firstProduct.price,
        },
      ]);

      if (orderItemsError) {
        console.error('Error inserting order items:', orderItemsError);
      }
    }
  }

  console.log('Database initialized successfully!');
}