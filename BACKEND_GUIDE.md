# Backend Technical Guide

## 1. Core Logic & Architecture
The backend follows a **Router -> Manager -> Model** architecture.
- **Routers**: Handle HTTP requests and input validation (using Joi/Validators).
- **Managers**: Implement business rules (e.g., aggregate stock logic, movement validation).
- **Models**: Interact with the database using Knex.js.

## 2. Category Hierarchy
The system maps backend tables to specific UI entities:
- **`global_category`** (Table) $\rightarrow$ **Category** (UI)
- **`category`** (Table) $\rightarrow$ **Sub Category** (UI)

### Database Relationships
- `category.global_category_id` references `global_category.global_category_id`.
- `products.category_id` references `category.category_id`.

## 3. Stock Management
Stock is not a flat number. It is derived from the `items` table.
- **Product**: The template (SKU).
- **Item**: The unique physical unit with a `status` ('available', 'sold', etc.).
- **Location Hierarchy**: Warehouse $\rightarrow$ Room $\rightarrow$ Rack $\rightarrow$ Shelf.

## 4. Key Implementation Patterns
### Aggregated Stock Calculation
Stock is calculated via subqueries in the `ProductModel` to ensure real-time accuracy:
```sql
(SELECT count(*) FROM items WHERE items.product_id = products.product_id AND items.status = 'available') as stock_quantity
```

### Variant Grouping
The `product_code_id` in the `products` table links multiple products to a single `product_codes` entry, allowing the UI to group variants like different sizes.

## 5. Migrations
Migrations are managed via Knex. The schema includes table definitions for all core entities (Users, Roles, Warehouses, Products, etc.). You can find the latest migrations in `src/models/migrations`.
