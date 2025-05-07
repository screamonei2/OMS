<script lang="ts">
    import { enhance } from "$app/forms";
    import { supabase } from "../supabase";
    import { goto } from "$app/navigation";
    import { handleAuthError } from "../utils/errorHandler";
    import type { ApiError } from "../types";

    let loading = false;
    let email = "";
    let password = "";
    let confirmPassword = "";
    let isSignUp = false;
    let error: ApiError | null = null;

    function toggleMode() {
        isSignUp = !isSignUp;
        error = null;
    }

    function validateForm(): boolean {
        if (!email || !password) {
            error = {
                message: "Por favor, preencha todos os campos",
                status: 400,
            };
            return false;
        }

        if (isSignUp && password !== confirmPassword) {
            error = { message: "As senhas não coincidem", status: 400 };
            return false;
        }

        if (password.length < 6) {
            error = {
                message: "A senha deve ter pelo menos 6 caracteres",
                status: 400,
            };
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            error = {
                message: "Por favor, insira um email válido",
                status: 400,
            };
            return false;
        }

        return true;
    }

    async function handleAuth(event: SubmitEvent) {
        event.preventDefault();
        if (!validateForm()) return;

        loading = true;
        error = null;

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

                if (signUpError) throw signUpError;
                error = {
                    message: "Verifique seu email para confirmar o cadastro!",
                    status: 200,
                };
            } else {
                const { error: signInError } =
                    await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                if (signInError) throw signInError;
                goto("/");
            }
        } catch (err) {
            error = handleAuthError(err);
        } finally {
            loading = false;
        }
    }
</script>

<div class="card bg-base-100 card-border border-base-300">
    <div class="card-body">
        <h2 class="card-title text-2xl font-bold mb-6">
            {isSignUp ? "Criar Conta" : "Entrar"}
        </h2>

        {#if error}
            <div
                class="alert {error.status === 200
                    ? 'alert-success'
                    : 'alert-error'} mb-4"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    {#if error.status === 200}
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    {:else}
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    {/if}
                </svg>
                <span>{error.message}</span>
            </div>
        {/if}

        <form on:submit={handleAuth} class="space-y-4">
            <div class="form-control">
                <label class="label" for="email">
                    <span class="label-text">Email</span>
                </label>
                <input
                    id="email"
                    type="email"
                    bind:value={email}
                    class="input input-bordered w-full"
                    placeholder="seu@email.com"
                    disabled={loading}
                />
            </div>

            <div class="form-control">
                <label class="label" for="password">
                    <span class="label-text">Senha</span>
                </label>
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    class="input input-bordered w-full"
                    placeholder="••••••••"
                    disabled={loading}
                />
            </div>

            {#if isSignUp}
                <div class="form-control">
                    <label class="label" for="confirmPassword">
                        <span class="label-text">Confirmar Senha</span>
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        bind:value={confirmPassword}
                        class="input input-bordered w-full"
                        placeholder="••••••••"
                        disabled={loading}
                    />
                </div>
            {/if}

            <button
                type="submit"
                class="btn btn-primary w-full"
                disabled={loading}
            >
                {#if loading}
                    <span class="loading loading-spinner"></span>
                {/if}
                {isSignUp ? "Cadastrar" : "Entrar"}
            </button>
        </form>

        <div class="divider">OU</div>

        <button
            type="button"
            class="btn btn-outline w-full"
            on:click={toggleMode}
            disabled={loading}
        >
            {isSignUp ? "Já tem uma conta? Entre" : "Criar nova conta"}
        </button>
    </div>
</div>
