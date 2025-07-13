# Clothing Store POS

This is a modern, offline-first Point of Sale (POS) application designed for a clothing store. It is built with Electron, React, and TypeScript, providing a robust and user-friendly interface for managing sales, inventory, and customers.

## Technologies Used

- **Electron:** For creating a cross-platform desktop application with web technologies.
- **React:** For building the user interface.
- **TypeScript:** For static typing and improved developer experience.
- **Tailwind CSS & shadcn/ui:** For styling and UI components.
- **Zustand:** For state management.
- **better-sqlite3:** For the local database.
- **i18next:** For internationalization and localization.
- **Electron Forge:** For packaging and distributing the application.

## Main Features

- **Point of Sale (POS):** A feature-rich POS interface for processing sales, including barcode scanning, discounts, and multiple payment methods.
- **Inventory Management:** Add, edit, and track products, including support for importing products from a CSV file.
- **Customer Management:** Maintain a customer database with support for loyalty points.
- **Reporting:** Generate reports on sales and inventory.
- **Offline-First:** The application is designed to work offline, with a sync mechanism to a remote server when an internet connection is available.
- **Role-Based Access Control (RBAC):** Different user roles with specific permissions.
- **Receipt Printing:** Print receipts for sales.

## Project Structure

The project is organized into the following directories:

- **`src/`**: Contains the main source code for the application.
  - **`auth/`**: Authentication and permission management.
  - **`components/`**: Reusable UI components.
  - **`customers/`**: Customer management components and types.
  - **`db/`**: Database management, including repositories for different data models.
  - **`inventory/`**: Inventory management components.
  - **`lib/`**: Utility functions.
  - **`pages/`**: Main pages of the application (e.g., POS, Inventory, Reports).
  - **`pos/`**: POS-related components and types.
  - **`printing/`**: Receipt printing service.
  - **`reports/`**: Reporting components and services.
  - **`store/`**: Zustand stores for state management.
  - **`sync/`**: Services for syncing data with a remote server.
- **`public/`**: Static assets.
- **`forge.config.ts`**: Configuration for Electron Forge.
- **`webpack.*.ts`**: Webpack configurations.

## Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/clothing-store-pos.git
   ```
2. **Install dependencies:**
   ```bash
   cd clothing-store-pos
   npm install
   ```
3. **Run the application in development mode:**
   ```bash
   npm start
   ```
4. **Package the application:**
   ```bash
   npm run package
   ```
5. **Create a distributable:**
   ```bash
   npm run make
   ```

## How to Contribute

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License.
