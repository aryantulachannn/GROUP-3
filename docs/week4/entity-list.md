# EduMart - Entity List

The EduMart system consists of the following core entities identified from our project requirements and data dictionary:

1. **STUDENT**: Represents registered users who browse the catalogue, manage a shopping cart, and place orders.
2. **CATEGORY**: Groups products into functional classifications (*Study Essential*, *For Assignments*, *Daily Use*, *Learning*).
3. **PRODUCT**: Represents the items available for students to view and purchase.
4. **CART_ITEM**: Represents temporary product selections added to a student's shopping cart before checkout.
5. **ORDER**: Records completed transaction metadata for a student.
6. **ORDER_ITEM**: A junction table capturing the specific snapshot of products, quantities, and prices tied to an order.
