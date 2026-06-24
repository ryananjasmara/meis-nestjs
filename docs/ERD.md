# Entity Relationship Diagram

Generated from [`prisma/schema.prisma`](../prisma/schema.prisma).

```mermaid
erDiagram
    USER {
        string id PK
        string email
        string password
        string name
        Role role
        datetime createdAt
        datetime updatedAt
    }

    CUSTOMER {
        string id PK
        string name
        string email
        string phone
        string address
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    INVOICE {
        string id PK
        string invoiceNumber
        InvoiceStatus status
        datetime issueDate
        datetime dueDate
        decimal totalAmount
        string notes
        string customerId FK
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    INVOICE_ITEM {
        string id PK
        string description
        int quantity
        decimal unitPrice
        decimal total
        string invoiceId FK
        datetime createdAt
        datetime updatedAt
    }

    USER ||--o{ CUSTOMER : "creates"
    USER ||--o{ INVOICE : "creates"
    CUSTOMER ||--o{ INVOICE : "is billed"
    INVOICE ||--o{ INVOICE_ITEM : "contains"
```

## Enums

- **Role**: `ADMIN`, `STAFF`
- **InvoiceStatus**: `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED`

## Notes

- `Invoice.totalAmount` is denormalized (sum of its `InvoiceItem.total` values), recalculated whenever items are added.
- `InvoiceItem` rows are deleted in cascade when their parent `Invoice` is deleted.
- Money fields (`totalAmount`, `unitPrice`, `total`) use `Decimal(12,2)` to avoid floating-point rounding errors.
