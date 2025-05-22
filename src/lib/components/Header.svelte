<script lang="ts">
import { onMount } from "svelte";
import { supabase } from "../supabase";
import { session, logout } from "$lib/stores/auth";
import Brand from "$lib/components/Brand.svelte";

    interface Notification {
        id: number;
        type: "low_stock" | "action_needed";
        message: string;
        recommendation?: string;
    }

    let notifications: Notification[] = [];

    async function fetchNotifications() {
        const { data: productsData, error } = await supabase
            .from("products")
            .select("*");

        if (error) {
            console.error("Error fetching products:", error);
            return;
        }

        let newNotifications: Notification[] = [];
        let id = 1;

        // Verificar produtos com estoque baixo
        productsData.forEach((product) => {
            if (product.stock < 10) {
                newNotifications.push({
                    id: id++,
                    type: "low_stock",
                    message: `Estoque baixo: ${product.name} (${product.stock} unidades)`,
                    recommendation: `Considere fazer um pedido de pelo menos ${Math.max(20 - product.stock, 10)} unidades.`,
                });
            }
        });

        // Verificar produtos sem estoque
        const outOfStock = productsData.filter((p) => p.stock === 0);
        if (outOfStock.length > 0) {
            newNotifications.push({
                id: id++,
                type: "action_needed",
                message: `${outOfStock.length} produtos sem estoque`,
                recommendation:
                    "Faça um pedido imediatamente para evitar perdas de vendas.",
            });
        }

        // Verificar produtos com estoque muito alto (possível excesso)
        const highStock = productsData.filter((p) => p.stock > 100);
        if (highStock.length > 0) {
            newNotifications.push({
                id: id++,
                type: "action_needed",
                message: `${highStock.length} produtos com estoque muito alto`,
                recommendation:
                    "Considere criar promoções para gerar mais vendas.",
            });
        }

        notifications = newNotifications;
    }

    onMount(() => {
        fetchNotifications();

        const subscription = supabase
            .channel("products_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products",
                },
                fetchNotifications,
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    });
</script>

<header>
    <!--     <div class="header-content">
        <h1>Painel Admin</h1>
        <div class="user-section">
            {#if $session?.user}
                <span class="user-email">{$session.user.email}</span>
                <button class="sign-out-btn" on:click={signOut}>
                    Sair
                </button>
            {/if}
        </div>
    </div> -->
    <div class="navbar">
        <div class="flex-1">
            <a href="/" class="gap-2">
            <Brand data-testid="brand-logo" />

            </a>
        </div>
        <div class="flex-none">
            <div class="dropdown dropdown-end">
                <button class="btn btn-ghost btn-circle">
                    <div class="indicator">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                            />
                        </svg>
                        {#if notifications.length > 0}
                            <span
                                class="badge badge-warning badge-sm indicator-item"
                                >{notifications.length}</span
                            >
                        {/if}
                    </div>
                </button>
                <div
                    class="card card-compact dropdown-content bg-base-100 z-1 mt-3 w-96 shadow"
                >
                    <div class="card-body">
                        {#if notifications.length > 0}
                            <span class="text-lg font-bold"
                                >{notifications.length} Notificações</span
                            >
                            <div class="space-y-4">
                                {#each notifications as notification}
                                    <div
                                        class="alert {notification.type ===
                                        'low_stock'
                                            ? 'alert-warning'
                                            : 'alert-info'}"
                                    >
                                        <div>
                                            <h3 class="font-bold">
                                                {notification.message}
                                            </h3>
                                            {#if notification.recommendation}
                                                <div class="text-sm">
                                                    {notification.recommendation}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <span class="text-lg font-bold"
                                >Nenhuma notificação</span
                            >
                            <p class="text-sm text-base-content/70">
                                Tudo está em ordem!
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
            <div class="dropdown dropdown-end">
                <button class="btn btn-ghost btn-circle avatar">
                    <div class="w-10 rounded-full">
                        <img
                            alt="Avatar do usuário"
                            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                        />
                    </div>
                </button>
                <ul
                    class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
                >
                    <li>
                        <a href="/profile"
                            ><svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="size-6 opacity-30"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                            </svg>
                            Perfil</a
                        >
                    </li>
                    <li>
                        <a href="/settings"
                            ><svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="size-6 opacity-30"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                                />
                            </svg>
                            Configurações</a
                        >
                    </li>
<li>
    <button on:click={logout}
        ><svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6 opacity-30"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
            />
        </svg>
        Sair</button
    >
</li>
                </ul>
            </div>
        </div>
    </div>
</header>
<!--  -->
<!-- <style>
    header {
        background-color: #2c3e50;
        color: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    .user-section {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .user-email {
        color: #ecf0f1;
    }

    .sign-out-btn {
        background-color: transparent;
        border: 1px solid #ecf0f1;
        color: #ecf0f1;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .sign-out-btn:hover {
        background-color: #ecf0f1;
        color: #2c3e50;
    }
</style> -->
