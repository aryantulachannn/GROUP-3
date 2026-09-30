# EduMart - Business Rules

1. **Student Registration**: Each student must possess a unique student ID number and a valid email address.
2. **Product Categorization**: Every product in the catalogue must be assigned to exactly one category.
3. **Cart Management**: Cart items reflect active intent; updating quantities modifies the existing cart line item rather than creating duplicates.
4. **Order Processing**: When an order is placed, snapshot prices (`unit_price`) must be locked into the `ORDER_ITEM` table to protect against future catalogue price changes.
5. **Data Integrity**: Foreign key constraints must be strictly enforced to prevent orphaned order items or cart references pointing to deleted products.
