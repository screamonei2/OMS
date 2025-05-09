<script lang="ts">
    import { onMount } from "svelte";
    import { supabase } from "../supabase";
    import { Chart, registerables } from "chart.js";
    import { colors, defaultOptions, titleFont } from "../chartConfig";

    Chart.register(...registerables);

    type OrderStatus =
        | "Pendente"
        | "Em Processamento"
        | "Entregue"
        | "Cancelado";

    let stats = {
        totalClients: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeClients: 0,
        ordersToday: 0,
        lowStockProducts: 0,
        ordersByStatus: {
            Pendente: 0,
            "Em Processamento": 0,
            Entregue: 0,
            Cancelado: 0,
        },
    };

    let orderTrendsChart: Chart | null = null;
    let statusChart: Chart | null = null;
    let revenueChart: Chart | null = null;
    let isUpdating = false;

    async function fetchStats() {
        if (isUpdating) return; // Prevent concurrent updates
        isUpdating = true;

        try {
            // Fetch total clients and active clients
            const { data: clientsData } = await supabase
                .from("clients")
                .select("status");

            if (clientsData) {
                stats.totalClients = clientsData.length;
                stats.activeClients = clientsData.filter(
                    (c) => c.status === "Ativo",
                ).length;
            }

            // Fetch products and low stock count
            const { data: productsData } = await supabase
                .from("products")
                .select("stock");

            if (productsData) {
                stats.totalProducts = productsData.length;
                stats.lowStockProducts = productsData.filter(
                    (p) => p.stock < 10,
                ).length;
            }

            // Fetch orders statistics
            const { data: ordersData } = await supabase
                .from("orders")
                .select("status, total, date");

            if (ordersData) {
                stats.totalOrders = ordersData.length;
                stats.totalRevenue = ordersData.reduce(
                    (sum, order) => sum + (order.total || 0),
                    0,
                );

                // Reset status counts
                Object.keys(stats.ordersByStatus).forEach((key) => {
                    stats.ordersByStatus[key as OrderStatus] = 0;
                });

                // Count orders by status
                ordersData.forEach((order) => {
                    const status = order.status as OrderStatus;
                    if (stats.ordersByStatus.hasOwnProperty(status)) {
                        stats.ordersByStatus[status]++;
                    }
                });

                // Count today's orders
                const today = new Date().toISOString().split("T")[0];
                stats.ordersToday = ordersData.filter(
                    (order) => order.date === today,
                ).length;

                // Prepare data for charts
                const lastDays = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split("T")[0];
                }).reverse();

                const ordersByDay = lastDays.map((date) => ({
                    date,
                    count: ordersData.filter((order) => order.date === date).length,
                    revenue: ordersData
                        .filter((order) => order.date === date)
                        .reduce((sum, order) => sum + (order.total || 0), 0),
                }));

                updateCharts(ordersByDay);
            }
        } finally {
            isUpdating = false;
        }
    }

    function destroyCharts() {
        if (orderTrendsChart) {
            orderTrendsChart.destroy();
            orderTrendsChart = null;
        }
        if (statusChart) {
            statusChart.destroy();
            statusChart = null;
        }
        if (revenueChart) {
            revenueChart.destroy();
            revenueChart = null;
        }
    }

    function updateCharts(
        ordersByDay: Array<{ date: string; count: number; revenue: number }>,
    ) {
        destroyCharts();

        // Update order trends chart
        const orderTrendsCtx = document.getElementById(
            "orderTrendsChart",
        ) as HTMLCanvasElement;
        if (orderTrendsCtx) {
            orderTrendsChart = new Chart(orderTrendsCtx, {
                type: "line",
                data: {
                    labels: ordersByDay.map((day) => day.date),
                    datasets: [
                        {
                            label: "Pedidos",
                            data: ordersByDay.map((day) => day.count),
                            borderColor: colors.primary,
                            backgroundColor: colors.primary,
                            fill: false,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                            display: true,
                            text: "Tendência de Pedidos (7 dias)",
                            font: {
                                size: 18,
                                weight: "bold",
                                family: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji',
                            },
                            align: "start",
                        },
                    },
                },
            });
        }

        // Update status distribution chart
        const statusCtx = document.getElementById(
            "statusChart",
        ) as HTMLCanvasElement;
        if (statusCtx) {
            statusChart = new Chart(statusCtx, {
                type: "doughnut",
                data: {
                    labels: Object.keys(stats.ordersByStatus),
                    datasets: [
                        {
                            data: Object.values(stats.ordersByStatus),
                            backgroundColor: [
                                colors.warning,
                                colors.info,
                                colors.success,
                                colors.error,
                            ],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                            display: true,
                            text: "Distribuição por Status",
                            font: {
                                size: 18,
                                weight: "bold",
                                family: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji',
                            },
                            align: "start",
                        },
                    },
                },
            });
        }

        // Update revenue chart
        const revenueCtx = document.getElementById(
            "revenueChart",
        ) as HTMLCanvasElement;
        if (revenueCtx) {
            revenueChart = new Chart(revenueCtx, {
                type: "bar",
                data: {
                    labels: ordersByDay.map((day) => day.date),
                    datasets: [
                        {
                            label: "Receita",
                            data: ordersByDay.map((day) => day.revenue),
                            backgroundColor: colors.success,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                            display: true,
                            text: "Receita por Dia (7 dias)",
                            font: {
                                size: 18,
                                weight: "bold",
                                family: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji',
                            },
                            align: "start",
                        },
                    },
                },
            });
        }
    }

    onMount(() => {
        fetchStats();

        // Subscribe to real-time changes
        const subscriptions = [
            supabase
                .channel("clients_changes")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "clients" },
                    fetchStats,
                )
                .subscribe(),
            supabase
                .channel("products_changes")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "products" },
                    fetchStats,
                )
                .subscribe(),
            supabase
                .channel("orders_changes")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "orders" },
                    fetchStats,
                )
                .subscribe(),
        ];

        return () => {
            subscriptions.forEach((subscription) => subscription.unsubscribe());
            destroyCharts();
        };
    });
</script>

<div class="grid gap-4">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="/clients">
            <div class="card bg-base-100 card-border border-base-300">
                <div class="card-body">
                    <div class="stat">
                        <div class="stat-title">Total de Clientes</div>
                        <div class="stat-value text-primary">
                            {stats.totalClients}
                        </div>
                        <div class="stat-desc">
                            {stats.activeClients} ativos
                        </div>
                    </div>
                </div>
            </div>
        </a>

        <a href="/products">
            <div class="card bg-base-100 card-border border-base-300">
                <div class="card-body">
                    <div class="stat">
                        <div class="stat-title">Total de Produtos</div>
                        <div class="stat-value text-secondary">
                            {stats.totalProducts}
                        </div>
                        <div class="stat-desc">
                            {stats.lowStockProducts} com estoque baixo
                        </div>
                    </div>
                </div>
            </div>
        </a>

        <a href="/orders">
            <div class="card bg-base-100 card-border border-base-300">
                <div class="card-body">
                    <div class="stat">
                        <div class="stat-title">Pedidos Hoje</div>
                        <div class="stat-value text-accent">
                            {stats.ordersToday}
                        </div>
                        <div class="stat-desc">Total: {stats.totalOrders}</div>
                    </div>
                </div>
            </div>
        </a>

        <div class="card bg-base-100 card-border border-base-300">
            <div class="card-body">
                <div class="stat">
                    <div class="stat-title">Receita Total</div>
                    <div class="stat-value text-success">
                        R$ {stats.totalRevenue.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Orders by Status -->
    <div class="card bg-base-100 card-border border-base-300">
        <div class="card-body">
            <h2 class="card-title mb-4">Status dos Pedidos</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="stat">
                    <div class="stat-title">Pendentes</div>
                    <div class="stat-value text-warning">
                        {stats.ordersByStatus.Pendente}
                    </div>
                </div>
                <div class="stat">
                    <div class="stat-title">Em Processamento</div>
                    <div class="stat-value text-info">
                        {stats.ordersByStatus["Em Processamento"]}
                    </div>
                </div>
                <div class="stat">
                    <div class="stat-title">Entregues</div>
                    <div class="stat-value text-success">
                        {stats.ordersByStatus.Entregue}
                    </div>
                </div>
                <div class="stat">
                    <div class="stat-title">Cancelados</div>
                    <div class="stat-value text-error">
                        {stats.ordersByStatus.Cancelado}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card bg-base-100 card-border border-base-300">
            <div class="card-body">
                <canvas id="orderTrendsChart" height="300"></canvas>
            </div>
        </div>

        <div class="card bg-base-100 card-border border-base-300">
            <div class="card-body">
                <canvas id="revenueChart" height="300"></canvas>
            </div>
        </div>

        <div class="card bg-base-100 card-border border-base-300 lg:col-span-2">
            <div
                class="card-body flex flex-col md:flex-row items-start justify-between gap-4"
            >
                <div class="w-full">
                    <canvas id="statusChart"></canvas>
                </div>
                <div class="stat-group grid grid-cols-2 gap-4 min-w-fit">
                    <div class="stat">
                        <div class="stat-title">Pendentes</div>
                        <div class="stat-value text-warning">
                            {stats.ordersByStatus.Pendente}
                        </div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Em Processamento</div>
                        <div class="stat-value text-info">
                            {stats.ordersByStatus["Em Processamento"]}
                        </div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Entregues</div>
                        <div class="stat-value text-success">
                            {stats.ordersByStatus.Entregue}
                        </div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Cancelados</div>
                        <div class="stat-value text-error">
                            {stats.ordersByStatus.Cancelado}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>