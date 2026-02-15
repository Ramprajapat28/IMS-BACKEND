# Backend Technical Deep Dive

## 1. Directory Structure Breakdown
The `src/` directory is organized by responsibility to ensure scalability.

- **`businesslogic/managers/`**: This is where the "brains" live. Managers handle complex operations that involve multiple models or external services. 
  - *Example*: `ProductManager.js` handles creating a product AND its initial codes/variants in one transaction.
- **`models/`**: Directly interacts with the database using Knex.js.
  - `libs/BaseModel.js`: Provides common methods like `find`, `create`, and `update` that all models inherit.
  - `migrations/`: Contains the SQL-like JS files that define the database tables.
- **`routes/controllers/`**: Defines the API endpoints. They receive requests, call the appropriate Manager, and return JSON responses.
- **`validators/`**: Contains Joi schemas to ensure incoming data (like `mrp` or `category_id`) is the correct type before processing.
- **`errorhandlers/`**: Centralized logic for catching database or business logic errors and returning user-friendly messages.

## 2. Request Lifecycle (Minute-to-Minute)

When a developer makes an API request (e.g., POST `/api/products`):
1. **Entry**: The request hits `server.js` and is routed via `RouteMap.js`.
2. **Validation**: The request data is checked against the schema in `validators/productValidator.js`.
3. **Controller**: `ProductRouter.js` receives the validated data.
4. **Manager**: The controller calls `ProductManager.createProduct()`. 
   - *Logic check*: "Does this global category exist?" "Is the SKU unique?"
5. **Model**: The manager calls `ProductModel.create()`, which executes the Knex SQL query.
6. **Response**: The result flows back up and is returned to the frontend as a JSON success object.

## 3. Core Logic: The Categorization mapping
This is critical for any new developer to understand:

| Entity | DB Table | UI Field Label | Responsiblity |
| :--- | :--- | :--- | :--- |
| **Global Category** | `global_category` | **Category** | High-level (e.g., "Men's Apparel") |
| **Category** | `category` | **Sub Category** | Specific (e.g., "T-Shirts") |

> [!TIP]
> Always check `global_category_id` first when debugging product list filters.

## 4. Database Entities & Relationships
- **Item-Product Relationship**: One `Product` (template) can have many `Items` (physical units).
- **Location Mapping**: Every `Item` has a `shelf_id`. A shelf belongs to a `rack_id`, which belongs to a `room_id`, which belongs to a `warehouse_id`.
- **Status Codes**: 
  - `available`: In stock and ready to sell.
  - `sold`: Out of stock.
  - `damaged`: quarantined units.

## 5. Security & Auth
The system uses JWT (JSON Web Tokens) for authentication. Middleware in `routes/middleware/` checks the `Authorization` header on protected routes to ensure only authorized staff can add or edit products.
