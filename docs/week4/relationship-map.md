# EduMart - Relationship Map & Cardinality

| Entity A | Relationship | Entity B | Cardinality | Description |
| :--- | :--- | :--- | :--- | :--- |
| **STUDENT** | Places | **ORDER** | One-to-Many (1:M) | A student can place multiple orders, but each order belongs to one student. |
| **STUDENT** | Adds | **CART_ITEM** | One-to-Many (1:M) | A student can have multiple items in their active cart session. |
| **CATEGORY** | Categorizes | **PRODUCT** | One-to-Many (1:M) | A category contains multiple products, but each product belongs to one category. |
| **PRODUCT** | Included in | **CART_ITEM** | One-to-Many (1:M) | A product can appear across multiple carts. |
| **PRODUCT** | Included in | **ORDER_ITEM** | One-to-Many (1:M) | A product can be ordered multiple times across different transaction items. |
| **ORDER** | Contains | **ORDER_ITEM** | One-to-Many (1:M) | An order consists of one or more order items. |
