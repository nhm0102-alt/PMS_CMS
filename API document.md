## Authentication

```bash
npm install @base44/sdk
```

```javascript
import { createClient } from '@base44/sdk';

const base44 = createClient({
  appId: "69a9086f3a811b4eb2124d2e",
  headers: {
    "api_key": "c2faa539ea6c44fb9bf0ecb922357e99"
  }
});
```
## Property

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes |  |
| `code` | string |  |  |
| `type` | `hotel`, `resort`, `hostel`, `villa`, `apartment`, `guesthouse` |  |  |
| `address` | string |  |  |
| `city` | string |  |  |
| `country` | string |  |  |
| `phone` | string |  |  |
| `email` | string |  |  |
| `website` | string |  |  |
| `star_rating` | number |  |  |
| `total_rooms` | number |  |  |
| `logo_url` | string |  |  |
| `cover_url` | string |  |  |
| `description` | string |  |  |
| `status` | `active`, `inactive`, `suspended`, `trial` |  |  |
| `license_type` | `basic`, `professional`, `enterprise` |  |  |
| `license_start` | string |  |  |
| `license_end` | string |  |  |
| `contract_status` | `active`, `expired`, `pending`, `cancelled` |  |  |
| `monthly_fee` | number |  |  |
| `timezone` | string |  |  |
| `currency` | string |  |  |
| `check_in_time` | string |  |  |
| `check_out_time` | string |  |  |
| `tax_rate` | number |  |  |
| `latitude` | number |  | Vĩ độ |
| `longitude` | number |  | Kinh độ |
| `images` | array |  | Danh sách URL ảnh của khách sạn |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/Property`
List Property records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.Property.list();
```

### `POST /entities/Property`
Create a Property record

```javascript
const record = await base44.entities.Property.create({
  // your data
});
```

### `DELETE /entities/Property`
Delete multiple Property records

```javascript
await base44.entities.Property.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  name: "Example name"
});
```

### `POST /entities/Property/bulk`
Bulk create Property records

```javascript
const records = await base44.entities.Property.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/Property/bulk`
Bulk update Property records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/Property/update-many`
Update many Property records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/Property/{Property_id}`
Get a Property record by ID

**Parameters:**
- `Property_id` (path): Record ID

```javascript
const record = await base44.entities.Property.get(recordId);
```

### `PUT /entities/Property/{Property_id}`
Update a Property record

**Parameters:**
- `Property_id` (path): Record ID

```javascript
const record = await base44.entities.Property.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/Property/{Property_id}`
Delete a Property record

**Parameters:**
- `Property_id` (path): Record ID

```javascript
await base44.entities.Property.delete(recordId);
```

### `PUT /entities/Property/{Property_id}/restore`
Restore a deleted Property record

**Parameters:**
- `Property_id` (path): Record ID

```javascript
const record = await base44.entities.Property.restore(recordId);
```

## RoomType

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `name` | string | Yes | Tên loại phòng |
| `code` | string |  |  |
| `description` | string |  |  |
| `standard_adults` | number |  | Tiêu chuẩn số người lớn |
| `max_adults` | number |  | Tối đa người lớn |
| `max_children` | number |  | Tối đa trẻ em |
| `max_occupancy` | number |  | Tổng sức chứa tối đa |
| `base_price` | number |  |  |
| `area` | number |  | Diện tích m2 |
| `bed_type` | `single`, `double`, `twin`, `king`, `queen`, `suite` |  |  |
| `amenities` | array |  |  |
| `images` | array |  |  |
| `is_active` | boolean |  |  |
| `total_rooms` | number |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/RoomType`
List RoomType records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.RoomType.list();
```

### `POST /entities/RoomType`
Create a RoomType record

```javascript
const record = await base44.entities.RoomType.create({
  // your data
});
```

### `DELETE /entities/RoomType`
Delete multiple RoomType records

```javascript
await base44.entities.RoomType.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/RoomType/bulk`
Bulk create RoomType records

```javascript
const records = await base44.entities.RoomType.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/RoomType/bulk`
Bulk update RoomType records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/RoomType/update-many`
Update many RoomType records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/RoomType/{RoomType_id}`
Get a RoomType record by ID

**Parameters:**
- `RoomType_id` (path): Record ID

```javascript
const record = await base44.entities.RoomType.get(recordId);
```

### `PUT /entities/RoomType/{RoomType_id}`
Update a RoomType record

**Parameters:**
- `RoomType_id` (path): Record ID

```javascript
const record = await base44.entities.RoomType.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/RoomType/{RoomType_id}`
Delete a RoomType record

**Parameters:**
- `RoomType_id` (path): Record ID

```javascript
await base44.entities.RoomType.delete(recordId);
```

### `PUT /entities/RoomType/{RoomType_id}/restore`
Restore a deleted RoomType record

**Parameters:**
- `RoomType_id` (path): Record ID

```javascript
const record = await base44.entities.RoomType.restore(recordId);
```

## Room

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `room_type_id` | string |  |  |
| `room_number` | string | Yes |  |
| `room_name` | string |  | Tên gọi của phòng, VD: Daisy, Rose... |
| `floor` | string |  |  |
| `status` | `available`, `occupied`, `dirty`, `cleaning`, `maintenance`, `out_of_order` |  |  |
| `notes` | string |  |  |
| `is_active` | boolean |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/Room`
List Room records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.Room.list();
```

### `POST /entities/Room`
Create a Room record

```javascript
const record = await base44.entities.Room.create({
  // your data
});
```

### `DELETE /entities/Room`
Delete multiple Room records

```javascript
await base44.entities.Room.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/Room/bulk`
Bulk create Room records

```javascript
const records = await base44.entities.Room.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/Room/bulk`
Bulk update Room records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/Room/update-many`
Update many Room records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/Room/{Room_id}`
Get a Room record by ID

**Parameters:**
- `Room_id` (path): Record ID

```javascript
const record = await base44.entities.Room.get(recordId);
```

### `PUT /entities/Room/{Room_id}`
Update a Room record

**Parameters:**
- `Room_id` (path): Record ID

```javascript
const record = await base44.entities.Room.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/Room/{Room_id}`
Delete a Room record

**Parameters:**
- `Room_id` (path): Record ID

```javascript
await base44.entities.Room.delete(recordId);
```

### `PUT /entities/Room/{Room_id}/restore`
Restore a deleted Room record

**Parameters:**
- `Room_id` (path): Record ID

```javascript
const record = await base44.entities.Room.restore(recordId);
```

## Guest

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string |  |  |
| `first_name` | string | Yes |  |
| `last_name` | string | Yes |  |
| `email` | string |  |  |
| `phone` | string |  |  |
| `nationality` | string |  |  |
| `id_type` | `passport`, `national_id`, `driver_license`, `other` |  |  |
| `id_number` | string |  |  |
| `date_of_birth` | string |  |  |
| `gender` | `male`, `female`, `other` |  |  |
| `address` | string |  |  |
| `city` | string |  |  |
| `country` | string |  |  |
| `loyalty_tier` | `standard`, `silver`, `gold`, `platinum` |  |  |
| `loyalty_points` | number |  |  |
| `total_stays` | number |  |  |
| `total_spent` | number |  |  |
| `notes` | string |  |  |
| `preferences` | string |  |  |
| `is_blacklisted` | boolean |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/Guest`
List Guest records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.Guest.list();
```

### `POST /entities/Guest`
Create a Guest record

```javascript
const record = await base44.entities.Guest.create({
  // your data
});
```

### `DELETE /entities/Guest`
Delete multiple Guest records

```javascript
await base44.entities.Guest.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  first_name: "Example first_name"
});
```

### `POST /entities/Guest/bulk`
Bulk create Guest records

```javascript
const records = await base44.entities.Guest.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/Guest/bulk`
Bulk update Guest records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/Guest/update-many`
Update many Guest records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/Guest/{Guest_id}`
Get a Guest record by ID

**Parameters:**
- `Guest_id` (path): Record ID

```javascript
const record = await base44.entities.Guest.get(recordId);
```

### `PUT /entities/Guest/{Guest_id}`
Update a Guest record

**Parameters:**
- `Guest_id` (path): Record ID

```javascript
const record = await base44.entities.Guest.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/Guest/{Guest_id}`
Delete a Guest record

**Parameters:**
- `Guest_id` (path): Record ID

```javascript
await base44.entities.Guest.delete(recordId);
```

### `PUT /entities/Guest/{Guest_id}/restore`
Restore a deleted Guest record

**Parameters:**
- `Guest_id` (path): Record ID

```javascript
const record = await base44.entities.Guest.restore(recordId);
```

## Reservation

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `reservation_number` | string |  |  |
| `guest_id` | string |  |  |
| `room_id` | string |  |  |
| `room_type_id` | string |  |  |
| `check_in_date` | string | Yes |  |
| `check_out_date` | string | Yes |  |
| `actual_check_in` | string |  |  |
| `actual_check_out` | string |  |  |
| `num_adults` | number |  |  |
| `num_children` | number |  |  |
| `nights` | number |  |  |
| `status` | `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`, `no_show` |  |  |
| `source` | `direct`, `phone`, `email`, `walk_in`, `booking_com`, `agoda`, `expedia`, `airbnb`, `traveloka`, `other_ota` |  |  |
| `room_rate` | number |  |  |
| `total_amount` | number |  |  |
| `discount_amount` | number |  |  |
| `tax_amount` | number |  |  |
| `deposit_amount` | number |  |  |
| `paid_amount` | number |  |  |
| `balance_due` | number |  |  |
| `promo_code` | string |  |  |
| `special_requests` | string |  |  |
| `internal_notes` | string |  |  |
| `payment_method` | `cash`, `credit_card`, `debit_card`, `bank_transfer`, `ota_prepaid`, `invoice` |  |  |
| `cancellation_reason` | string |  |  |
| `rate_plan` | string |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/Reservation`
List Reservation records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.Reservation.list();
```

### `POST /entities/Reservation`
Create a Reservation record

```javascript
const record = await base44.entities.Reservation.create({
  // your data
});
```

### `DELETE /entities/Reservation`
Delete multiple Reservation records

```javascript
await base44.entities.Reservation.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/Reservation/bulk`
Bulk create Reservation records

```javascript
const records = await base44.entities.Reservation.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/Reservation/bulk`
Bulk update Reservation records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/Reservation/update-many`
Update many Reservation records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/Reservation/{Reservation_id}`
Get a Reservation record by ID

**Parameters:**
- `Reservation_id` (path): Record ID

```javascript
const record = await base44.entities.Reservation.get(recordId);
```

### `PUT /entities/Reservation/{Reservation_id}`
Update a Reservation record

**Parameters:**
- `Reservation_id` (path): Record ID

```javascript
const record = await base44.entities.Reservation.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/Reservation/{Reservation_id}`
Delete a Reservation record

**Parameters:**
- `Reservation_id` (path): Record ID

```javascript
await base44.entities.Reservation.delete(recordId);
```

### `PUT /entities/Reservation/{Reservation_id}/restore`
Restore a deleted Reservation record

**Parameters:**
- `Reservation_id` (path): Record ID

```javascript
const record = await base44.entities.Reservation.restore(recordId);
```

## UserProperty

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `user_email` | string | Yes |  |
| `property_id` | string | Yes |  |
| `role_name` | string |  | Tên bộ quyền do hotel admin đặt |
| `permissions` | array |  | Danh sách module được phép truy cập |
| `is_hotel_admin` | boolean |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/UserProperty`
List UserProperty records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.UserProperty.list();
```

### `POST /entities/UserProperty`
Create a UserProperty record

```javascript
const record = await base44.entities.UserProperty.create({
  // your data
});
```

### `DELETE /entities/UserProperty`
Delete multiple UserProperty records

```javascript
await base44.entities.UserProperty.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  user_email: "Example user_email"
});
```

### `POST /entities/UserProperty/bulk`
Bulk create UserProperty records

```javascript
const records = await base44.entities.UserProperty.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/UserProperty/bulk`
Bulk update UserProperty records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/UserProperty/update-many`
Update many UserProperty records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/UserProperty/{UserProperty_id}`
Get a UserProperty record by ID

**Parameters:**
- `UserProperty_id` (path): Record ID

```javascript
const record = await base44.entities.UserProperty.get(recordId);
```

### `PUT /entities/UserProperty/{UserProperty_id}`
Update a UserProperty record

**Parameters:**
- `UserProperty_id` (path): Record ID

```javascript
const record = await base44.entities.UserProperty.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/UserProperty/{UserProperty_id}`
Delete a UserProperty record

**Parameters:**
- `UserProperty_id` (path): Record ID

```javascript
await base44.entities.UserProperty.delete(recordId);
```

### `PUT /entities/UserProperty/{UserProperty_id}/restore`
Restore a deleted UserProperty record

**Parameters:**
- `UserProperty_id` (path): Record ID

```javascript
const record = await base44.entities.UserProperty.restore(recordId);
```

## Invoice

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `reservation_id` | string |  |  |
| `guest_id` | string |  |  |
| `invoice_number` | string |  |  |
| `type` | `checkout`, `deposit`, `service`, `refund`, `credit_note` |  |  |
| `items` | array |  |  |
| `subtotal` | number |  |  |
| `tax_amount` | number |  |  |
| `discount_amount` | number |  |  |
| `total_amount` | number |  |  |
| `paid_amount` | number |  |  |
| `balance_due` | number |  |  |
| `payment_method` | string |  |  |
| `status` | `draft`, `issued`, `paid`, `partially_paid`, `overdue`, `cancelled` |  |  |
| `notes` | string |  |  |
| `issue_date` | string |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/Invoice`
List Invoice records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.Invoice.list();
```

### `POST /entities/Invoice`
Create a Invoice record

```javascript
const record = await base44.entities.Invoice.create({
  // your data
});
```

### `DELETE /entities/Invoice`
Delete multiple Invoice records

```javascript
await base44.entities.Invoice.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/Invoice/bulk`
Bulk create Invoice records

```javascript
const records = await base44.entities.Invoice.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/Invoice/bulk`
Bulk update Invoice records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/Invoice/update-many`
Update many Invoice records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/Invoice/{Invoice_id}`
Get a Invoice record by ID

**Parameters:**
- `Invoice_id` (path): Record ID

```javascript
const record = await base44.entities.Invoice.get(recordId);
```

### `PUT /entities/Invoice/{Invoice_id}`
Update a Invoice record

**Parameters:**
- `Invoice_id` (path): Record ID

```javascript
const record = await base44.entities.Invoice.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/Invoice/{Invoice_id}`
Delete a Invoice record

**Parameters:**
- `Invoice_id` (path): Record ID

```javascript
await base44.entities.Invoice.delete(recordId);
```

### `PUT /entities/Invoice/{Invoice_id}/restore`
Restore a deleted Invoice record

**Parameters:**
- `Invoice_id` (path): Record ID

```javascript
const record = await base44.entities.Invoice.restore(recordId);
```

## LicenseTransaction

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `transaction_type` | `new_license`, `renewal`, `upgrade`, `downgrade`, `cancellation`, `payment` |  |  |
| `license_type` | string |  |  |
| `amount` | number |  |  |
| `currency` | string |  |  |
| `payment_method` | string |  |  |
| `payment_status` | `pending`, `paid`, `failed`, `refunded` |  |  |
| `period_start` | string |  |  |
| `period_end` | string |  |  |
| `notes` | string |  |  |
| `invoice_number` | string |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/LicenseTransaction`
List LicenseTransaction records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.LicenseTransaction.list();
```

### `POST /entities/LicenseTransaction`
Create a LicenseTransaction record

```javascript
const record = await base44.entities.LicenseTransaction.create({
  // your data
});
```

### `DELETE /entities/LicenseTransaction`
Delete multiple LicenseTransaction records

```javascript
await base44.entities.LicenseTransaction.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/LicenseTransaction/bulk`
Bulk create LicenseTransaction records

```javascript
const records = await base44.entities.LicenseTransaction.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/LicenseTransaction/bulk`
Bulk update LicenseTransaction records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/LicenseTransaction/update-many`
Update many LicenseTransaction records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/LicenseTransaction/{LicenseTransaction_id}`
Get a LicenseTransaction record by ID

**Parameters:**
- `LicenseTransaction_id` (path): Record ID

```javascript
const record = await base44.entities.LicenseTransaction.get(recordId);
```

### `PUT /entities/LicenseTransaction/{LicenseTransaction_id}`
Update a LicenseTransaction record

**Parameters:**
- `LicenseTransaction_id` (path): Record ID

```javascript
const record = await base44.entities.LicenseTransaction.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/LicenseTransaction/{LicenseTransaction_id}`
Delete a LicenseTransaction record

**Parameters:**
- `LicenseTransaction_id` (path): Record ID

```javascript
await base44.entities.LicenseTransaction.delete(recordId);
```

### `PUT /entities/LicenseTransaction/{LicenseTransaction_id}/restore`
Restore a deleted LicenseTransaction record

**Parameters:**
- `LicenseTransaction_id` (path): Record ID

```javascript
const record = await base44.entities.LicenseTransaction.restore(recordId);
```

## Policy

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `name` | string | Yes | Tên chính sách |
| `type` | `cancellation`, `surcharge` | Yes | Loại chính sách |
| `cancellation_rules` | array |  | Các mốc chính sách hủy |
| `extra_adult_fee` | number |  | Phụ thu người lớn thêm (VND) |
| `child_rules` | array |  | Chính sách phụ thu trẻ em theo độ tuổi |
| `extra_bed_fee` | number |  | Phụ thu giường phụ (VND/đêm) |
| `extra_bed_available` | boolean |  |  |
| `is_active` | boolean |  |  |
| `notes` | string |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/Policy`
List Policy records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.Policy.list();
```

### `POST /entities/Policy`
Create a Policy record

```javascript
const record = await base44.entities.Policy.create({
  // your data
});
```

### `DELETE /entities/Policy`
Delete multiple Policy records

```javascript
await base44.entities.Policy.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/Policy/bulk`
Bulk create Policy records

```javascript
const records = await base44.entities.Policy.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/Policy/bulk`
Bulk update Policy records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/Policy/update-many`
Update many Policy records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/Policy/{Policy_id}`
Get a Policy record by ID

**Parameters:**
- `Policy_id` (path): Record ID

```javascript
const record = await base44.entities.Policy.get(recordId);
```

### `PUT /entities/Policy/{Policy_id}`
Update a Policy record

**Parameters:**
- `Policy_id` (path): Record ID

```javascript
const record = await base44.entities.Policy.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/Policy/{Policy_id}`
Delete a Policy record

**Parameters:**
- `Policy_id` (path): Record ID

```javascript
await base44.entities.Policy.delete(recordId);
```

### `PUT /entities/Policy/{Policy_id}/restore`
Restore a deleted Policy record

**Parameters:**
- `Policy_id` (path): Record ID

```javascript
const record = await base44.entities.Policy.restore(recordId);
```

## RatePlan

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `name` | string | Yes | Tên gói giá |
| `code` | string |  |  |
| `description` | string |  |  |
| `room_type_ids` | array |  | Áp dụng cho hạng phòng nào |
| `cancellation_policy_id` | string |  | ID chính sách hoàn hủy áp dụng |
| `surcharge_policy_id` | string |  | ID chính sách phụ thu áp dụng |
| `meal_plan` | `none`, `breakfast`, `half_board`, `full_board`, `all_inclusive` |  | Chế độ ăn |
| `services` | array |  | Các dịch vụ đi kèm |
| `price_modifier_type` | `fixed`, `percent` |  | Điều chỉnh giá so với giá gốc |
| `price_modifier_value` | number |  | Giá trị điều chỉnh (số %, hoặc số tiền cố định VND) |
| `min_stay` | number |  |  |
| `max_stay` | number |  |  |
| `is_active` | boolean |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/RatePlan`
List RatePlan records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.RatePlan.list();
```

### `POST /entities/RatePlan`
Create a RatePlan record

```javascript
const record = await base44.entities.RatePlan.create({
  // your data
});
```

### `DELETE /entities/RatePlan`
Delete multiple RatePlan records

```javascript
await base44.entities.RatePlan.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/RatePlan/bulk`
Bulk create RatePlan records

```javascript
const records = await base44.entities.RatePlan.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/RatePlan/bulk`
Bulk update RatePlan records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/RatePlan/update-many`
Update many RatePlan records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/RatePlan/{RatePlan_id}`
Get a RatePlan record by ID

**Parameters:**
- `RatePlan_id` (path): Record ID

```javascript
const record = await base44.entities.RatePlan.get(recordId);
```

### `PUT /entities/RatePlan/{RatePlan_id}`
Update a RatePlan record

**Parameters:**
- `RatePlan_id` (path): Record ID

```javascript
const record = await base44.entities.RatePlan.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/RatePlan/{RatePlan_id}`
Delete a RatePlan record

**Parameters:**
- `RatePlan_id` (path): Record ID

```javascript
await base44.entities.RatePlan.delete(recordId);
```

### `PUT /entities/RatePlan/{RatePlan_id}/restore`
Restore a deleted RatePlan record

**Parameters:**
- `RatePlan_id` (path): Record ID

```javascript
const record = await base44.entities.RatePlan.restore(recordId);
```

## FolioTransaction

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `property_id` | string | Yes |  |
| `reservation_id` | string | Yes |  |
| `folio_number` | string |  | e.g. F-0001-A (one reservation can have multiple folios) |
| `transaction_type` | `room_charge`, `extra_charge`, `payment`, `refund`, `discount`, `tax`, `transfer_in`, `transfer_out`, `adjustment`, `void`, `deposit`, `ota_virtual_card`, `city_ledger`, `late_checkout_fee`, `extra_bed_fee`, `service_charge`, `minibar`, `restaurant`, `laundry`, `spa`, `transport`, `other_charge` | Yes |  |
| `amount` | number | Yes | Positive = debit (charge), Negative = credit (payment/refund) |
| `currency` | string |  |  |
| `description` | string |  |  |
| `reference_number` | string |  | Payment ref, receipt no, etc. |
| `payment_method` | `cash`, `credit_card`, `debit_card`, `bank_transfer`, `ota_prepaid`, `city_ledger`, `complimentary`, `other` |  |  |
| `business_date` | string |  | Hotel business date (not system date) |
| `posted_by` | string |  | User email who posted this |
| `status` | `active`, `voided`, `transferred` |  |  |
| `void_reason` | string |  |  |
| `voided_by` | string |  |  |
| `voided_at` | string |  |  |
| `tax_rate` | number |  |  |
| `tax_amount` | number |  |  |
| `is_tax_line` | boolean |  | True if this row IS the tax line (not the charge itself) |
| `parent_transaction_id` | string |  | For tax lines linked to a charge, or refund linked to payment |
| `charge_date` | string |  | The date this charge applies to (for nightly room charges) |
| `is_night_audit` | boolean |  |  |
| `notes` | string |  |  |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/FolioTransaction`
List FolioTransaction records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.FolioTransaction.list();
```

### `POST /entities/FolioTransaction`
Create a FolioTransaction record

```javascript
const record = await base44.entities.FolioTransaction.create({
  // your data
});
```

### `DELETE /entities/FolioTransaction`
Delete multiple FolioTransaction records

```javascript
await base44.entities.FolioTransaction.deleteMany({
  // query filter — WARNING: empty {} deletes ALL records
  property_id: "Example property_id"
});
```

### `POST /entities/FolioTransaction/bulk`
Bulk create FolioTransaction records

```javascript
const records = await base44.entities.FolioTransaction.bulkCreate([
  { /* record 1 */ },
  { /* record 2 */ },
]);
```

### `PUT /entities/FolioTransaction/bulk`
Bulk update FolioTransaction records

```javascript
// bulk-update is not available via SDK — use the REST API
```

### `PATCH /entities/FolioTransaction/update-many`
Update many FolioTransaction records by query

```javascript
// update-many is not available via SDK — use the REST API
```

### `GET /entities/FolioTransaction/{FolioTransaction_id}`
Get a FolioTransaction record by ID

**Parameters:**
- `FolioTransaction_id` (path): Record ID

```javascript
const record = await base44.entities.FolioTransaction.get(recordId);
```

### `PUT /entities/FolioTransaction/{FolioTransaction_id}`
Update a FolioTransaction record

**Parameters:**
- `FolioTransaction_id` (path): Record ID

```javascript
const record = await base44.entities.FolioTransaction.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/FolioTransaction/{FolioTransaction_id}`
Delete a FolioTransaction record

**Parameters:**
- `FolioTransaction_id` (path): Record ID

```javascript
await base44.entities.FolioTransaction.delete(recordId);
```

### `PUT /entities/FolioTransaction/{FolioTransaction_id}/restore`
Restore a deleted FolioTransaction record

**Parameters:**
- `FolioTransaction_id` (path): Record ID

```javascript
const record = await base44.entities.FolioTransaction.restore(recordId);
```

## User

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string | Yes | The email of the user |
| `full_name` | string | Yes | The full name of the user |
| `role` | `admin`, `user` | Yes | The role of the user in the app |
| `id` | string |  | Unique record identifier |
| `created_date` | string |  | Record creation timestamp |
| `updated_date` | string |  | Record last update timestamp |
| `created_by` | string |  | Email of the user who created the record |

### Endpoints

### `GET /entities/User`
List User records

**Parameters:**
- `q` (query): JSON query filter, e.g. {"status":"active"}
- `limit` (query): Maximum number of records to return
- `skip` (query): Number of records to skip (pagination)
- `sort_by` (query): Field name to sort by. Prefix with '-' for descending order, e.g. -created_date

```javascript
const records = await base44.entities.User.list();
```

### `POST /entities/User`
Create a User record

```javascript
const record = await base44.entities.User.create({
  // your data
});
```

### `GET /entities/User/{User_id}`
Get a User record by ID

**Parameters:**
- `User_id` (path): Record ID

```javascript
const record = await base44.entities.User.get(recordId);
```

### `PUT /entities/User/{User_id}`
Update a User record

**Parameters:**
- `User_id` (path): Record ID

```javascript
const record = await base44.entities.User.update(recordId, {
  // fields to update
});
```

### `DELETE /entities/User/{User_id}`
Delete a User record

**Parameters:**
- `User_id` (path): Record ID

```javascript
await base44.entities.User.delete(recordId);
```
