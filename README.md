# Order Management System (OMS)

The Order Management System (OMS) is a web application built with SvelteKit, Tailwind CSS, and Supabase. It provides a comprehensive solution for managing orders, clients, products, and categories in a business environment.

## Features

- **User Authentication**: Secure login and registration using Supabase Auth.
- **Order Management**: Create, view, and manage orders with detailed information.
- **Client Management**: Add and manage client information.
- **Product Management**: Add and manage product details.
- **Category Management**: Organize products into categories.
- **Notifications**: Real-time notifications for order updates and other important events.
- **Permissions**: Role-based access control to manage user permissions.

## Project Structure

The project follows a modular structure with clear separation of concerns:

- **Components**: Reusable UI components.
- **Services**: Business logic and data fetching.
- **Stores**: Global state management.
- **Routes**: Application routes and pages.
- **Types**: TypeScript type definitions.
- **Utils**: Utility functions and helpers.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn or pnpm
- Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/screamonei2/OMS.git
cd OMS
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

Create a `.env` file in the root directory and add your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Application

1. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

2. Open your browser and navigate to `http://localhost:5173`.

### Building for Production

To create a production version of your app:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add your feature'`).
5. Push to the branch (`git push origin feature/your-feature`).
6. Open a pull request.

## License

This project is licensed under the MIT License.
