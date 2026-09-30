# EduMart - Database Design Notes

- **Primary Keys (PK)**: Every entity uses an integer `id` as its primary key to ensure fast indexing and clean relational mapping.
- **Foreign Keys (FK)**: Relational integrity is maintained using foreign keys (`category_id`, `student_id`, `product_id`, `order_id`).
- **Normalization**: The database is structured to Third Normal Form (3NF) standards, reducing data redundancy by separating cart states and order history items into dedicated junction tables.
- **Future Scalability**: The structure supports future enhancements such as product reviews, payment gateway integration tables, and student wishlists.
