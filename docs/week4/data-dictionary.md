| Field Name | Description | Example Value | Required? |
| :--- | :--- | :--- | :--- |
| `student_id` | Unique university or student identification number. | `S1092834` | Yes |
| `name` | Full name of the registered student. | `Alex Johnson` | Yes |
| `email` | Student's institutional or personal email address. | `alex.johnson@student.edu` | Yes |
| `category_id` | Foreign key linking a product to its category. | `2` | Yes |
| `title` | Display name of the product in the catalogue. | `Wireless Headphones` | Yes |
| `description` | Brief overview or specification of the product. | `Perfect for online classes and study sessions.` | No |
| `price` | Cost of the product listed in USD. | `129.99` | Yes |
| `image_url` | URL path linking to the product's display image. | `https://images.unsplash.com/photo-150574` | Yes |
| `quantity` | Number of units of a product added to the cart or order. | `2` | Yes |
| `total_amount` | Final calculated cost of all items in a placed order. | `259.98` | Yes |
| `order_date` | Timestamp of when the student successfully submitted the order. | `2030-06-15 14:30:00` | Yes |
