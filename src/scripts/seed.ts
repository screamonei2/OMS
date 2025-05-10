import { supabase } from '../lib/supabase';

async function seedData() {
    console.log('Inserting categories...');
    const { error: categoriesError } = await supabase.from('categories').upsert([
        { name: 'Eletrônicos' },
        { name: 'Móveis' },
        { name: 'Roupas' },
        { name: 'Alimentos' },
        { name: 'Bebidas' },
        { name: 'Livros' },
        { name: 'Brinquedos' },
        { name: 'Ferramentas' },
        { name: 'Jardinagem' },
        { name: 'Decoração' },
        { name: 'Esportes' },
        { name: 'Música' },
        { name: 'Arte' },
        { name: 'Saúde' },
        { name: 'Beleza' },
        { name: 'Pet Shop' },
        { name: 'Automotivo' },
        { name: 'Papelaria' },
        { name: 'Informática' },
        { name: 'Casa e Banho' }
    ]);

    if (categoriesError) {
        console.error('Error inserting categories:', categoriesError);
        return;
    }

    console.log('Inserting clients...');
    const { error: clientsError } = await supabase.from('clients').upsert([
        { name: 'João Silva', email: 'joao@email.com', phone: '(11) 98765-4321', status: 'Ativo' },
        { name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98765-4322', status: 'Ativo' },
        { name: 'Pedro Oliveira', email: 'pedro@email.com', phone: '(11) 98765-4323', status: 'Inativo' },
        { name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 98765-4324', status: 'Ativo' },
        { name: 'Carlos Ferreira', email: 'carlos@email.com', phone: '(11) 98765-4325', status: 'Prospecto' },
        { name: 'Lucia Lima', email: 'lucia@email.com', phone: '(11) 98765-4326', status: 'Ativo' },
        { name: 'Roberto Alves', email: 'roberto@email.com', phone: '(11) 98765-4327', status: 'Ativo' },
        { name: 'Fernanda Pereira', email: 'fernanda@email.com', phone: '(11) 98765-4328', status: 'Inativo' },
        { name: 'José Santos', email: 'jose@email.com', phone: '(11) 98765-4329', status: 'Ativo' },
        { name: 'Paula Ribeiro', email: 'paula@email.com', phone: '(11) 98765-4330', status: 'Prospecto' },
        { name: 'Miguel Souza', email: 'miguel@email.com', phone: '(11) 98765-4331', status: 'Ativo' },
        { name: 'Clara Rodrigues', email: 'clara@email.com', phone: '(11) 98765-4332', status: 'Ativo' },
        { name: 'Bruno Castro', email: 'bruno@email.com', phone: '(11) 98765-4333', status: 'Inativo' },
        { name: 'Beatriz Martins', email: 'beatriz@email.com', phone: '(11) 98765-4334', status: 'Ativo' },
        { name: 'Ricardo Lima', email: 'ricardo@email.com', phone: '(11) 98765-4335', status: 'Prospecto' },
        { name: 'Amanda Silva', email: 'amanda@email.com', phone: '(11) 98765-4336', status: 'Ativo' },
        { name: 'Lucas Oliveira', email: 'lucas@email.com', phone: '(11) 98765-4337', status: 'Ativo' },
        { name: 'Mariana Costa', email: 'mariana@email.com', phone: '(11) 98765-4338', status: 'Inativo' },
        { name: 'Gabriel Santos', email: 'gabriel@email.com', phone: '(11) 98765-4339', status: 'Ativo' },
        { name: 'Julia Ferreira', email: 'julia@email.com', phone: '(11) 98765-4340', status: 'Prospecto' }
    ]);

    if (clientsError) {
        console.error('Error inserting clients:', clientsError);
        return;
    }

    console.log('Inserting products...');
    const { error: productsError } = await supabase.from('products').upsert([
        { name: 'Smartphone XYZ', price: 1299.99, stock: 50, category: 'Eletrônicos' },
        { name: 'Sofá 3 Lugares', price: 1999.99, stock: 10, category: 'Móveis' },
        { name: 'Camiseta Básica', price: 49.99, stock: 100, category: 'Roupas' },
        { name: 'Arroz 5kg', price: 24.99, stock: 200, category: 'Alimentos' },
        { name: 'Vinho Tinto', price: 89.99, stock: 30, category: 'Bebidas' },
        { name: 'Romance Bestseller', price: 59.99, stock: 45, category: 'Livros' },
        { name: 'Boneca Interativa', price: 199.99, stock: 25, category: 'Brinquedos' },
        { name: 'Kit Ferramentas', price: 299.99, stock: 15, category: 'Ferramentas' },
        { name: 'Vaso de Planta', price: 79.99, stock: 40, category: 'Jardinagem' },
        { name: 'Quadro Decorativo', price: 149.99, stock: 20, category: 'Decoração' },
        { name: 'Bola de Futebol', price: 89.99, stock: 60, category: 'Esportes' },
        { name: 'Violão Acústico', price: 599.99, stock: 8, category: 'Música' },
        { name: 'Kit Pintura', price: 129.99, stock: 35, category: 'Arte' },
        { name: 'Vitamina C', price: 39.99, stock: 150, category: 'Saúde' },
        { name: 'Perfume Floral', price: 199.99, stock: 25, category: 'Beleza' },
        { name: 'Ração Premium', price: 89.99, stock: 80, category: 'Pet Shop' },
        { name: 'Óleo Motor', price: 34.99, stock: 100, category: 'Automotivo' },
        { name: 'Caderno Universitário', price: 19.99, stock: 200, category: 'Papelaria' },
        { name: 'Mouse Sem Fio', price: 79.99, stock: 45, category: 'Informática' },
        { name: 'Toalha de Banho', price: 44.99, stock: 75, category: 'Casa e Banho' }
    ]);

    if (productsError) {
        console.error('Error inserting products:', productsError);
        return;
    }

    console.log('Inserting orders...');
    for (let i = 1; i <= 20; i++) {
        const clientId = i;
        const product1Id = Math.floor(Math.random() * 20) + 1;
        const product2Id = Math.floor(Math.random() * 20) + 1;
        const quantity1 = Math.floor(Math.random() * 3) + 1;
        const quantity2 = Math.floor(Math.random() * 3) + 1;
        
        // Get product prices
        const { data: product1 } = await supabase
            .from('products')
            .select('price')
            .eq('id', product1Id)
            .single();
        
        const { data: product2 } = await supabase
            .from('products')
            .select('price')
            .eq('id', product2Id)
            .single();
        
        if (!product1 || !product2) continue;
        
        const total = (product1.price * quantity1) + (product2.price * quantity2);
        const date = new Date(2025, 4, i); // May 1-20, 2025
        const statuses = ['Pendente', 'Processando', 'Entregue', 'Cancelado'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                client_id: clientId,
                total,
                status,
                date: date.toISOString().split('T')[0]
            }])
            .select()
            .single();
        
        if (orderError) {
            console.error(`Error creating order ${i}:`, orderError);
            continue;
        }
        
        // Create order items
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert([
                {
                    order_id: order.id,
                    product_id: product1Id,
                    quantity: quantity1,
                    price: product1.price
                },
                {
                    order_id: order.id,
                    product_id: product2Id,
                    quantity: quantity2,
                    price: product2.price
                }
            ]);
            
        if (itemsError) {
            console.error(`Error creating order items for order ${i}:`, itemsError);
        }
    }
    
    console.log('Seed completed successfully!');
}

seedData().catch(console.error);
