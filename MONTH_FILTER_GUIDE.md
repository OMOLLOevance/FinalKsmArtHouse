# Quick Reference Guide - Month Filtering Feature

## 🎯 How to Use the Month Filter

### Quotations Page (`/events` → Quotations Tab)

**Location:** Top right of the page, next to the "New Quotation" button

**Controls:**
1. **Month Dropdown** - Select specific month or "All Months"
2. **Year Selector** - Choose year (current ± 1 year)
3. **Staff Filter** (Directors/Managers only) - Filter by staff member

**Example Usage:**
```
1. Navigate to Events → Quotations
2. Select "March" from month dropdown
3. Select "2026" from year dropdown
4. View only quotations created in March 2026
5. Select "All Months" to see everything again
```

---

## 📋 What Changed

### Before
```
Navigation:
├── Intelligence Hub (Dashboard)
├── Operations
│   ├── Event Management
│   ├── Gym Management
│   ├── Restaurant
│   └── Sauna & Spa
└── Client Relations
    └── Customer Database

Quotations: No month filter
Customers: Month selector only
```

### After
```
Navigation:
├── Operations
│   ├── Event Management
│   ├── Gym Management
│   ├── Restaurant
│   └── Sauna & Spa
└── Client Relations
    └── Customer Database

Quotations: Month + Year dropdowns ✅
Customers: Month selector (already existed) ✅
Dashboard: Directors/Investors only ✅
```

---

## 🔍 Filter Behavior

### Quotations Filter
- **Filters by:** When the quotation was created (`created_at`)
- **Default:** "All Months" (shows everything)
- **Behavior:** Instant update, no page reload
- **Combines with:** Staff filter (if you're a director/manager)

### Customers/Decor Allocations Filter
- **Filters by:** Month selector at top of page
- **Default:** Current month
- **Behavior:** Instant update, no page reload
- **Combines with:** Staff filter (if you're a director/manager)

---

## 🎨 UI Components Added

### Month Dropdown
```html
<select>
  <option value="all">All Months</option>
  <option value="1">January</option>
  <option value="2">February</option>
  ...
  <option value="12">December</option>
</select>
```

### Year Selector
```html
<select>
  <option value="2025">2025</option>
  <option value="2026">2026</option>
  <option value="2027">2027</option>
</select>
```

---

## 🚀 API Endpoints Updated

### Quotations API
```
GET /api/quotations?month=3&year=2026
GET /api/quotations?month=all
GET /api/quotations?month=3&year=2026&filterUserId=xxx
```

### Customers API
```
GET /api/customers?month=3&year=2026
GET /api/customers?month=all
```

---

## 💡 Tips

1. **Default View:** Always starts with "All Months" to show all data
2. **Quick Reset:** Select "All Months" to clear the filter
3. **Year Range:** Can view data from previous year, current year, or next year
4. **Staff Filter:** Directors/Managers can combine month filter with staff filter
5. **Performance:** Server-side filtering means faster load times for large datasets

---

## 🐛 Troubleshooting

### "No quotations found"
- Check if you have data for the selected month/year
- Try selecting "All Months" to see all data
- Verify you're not filtering by a staff member with no data

### Filter not working
- Refresh the page
- Check your internet connection
- Verify you're logged in

### Can't see month filter
- Make sure you're on the Quotations page (not the form)
- Check if you're logged in with proper permissions

---

## 📊 Data Fields Used

| Feature | Database Table | Filter Field | Field Type |
|---------|---------------|--------------|------------|
| Quotations | `quotations` | `created_at` | TIMESTAMPTZ |
| Customers | `customers` | `created_at` | TIMESTAMPTZ |
| Decor Allocations | `monthly_allocations` | `month`, `year` | INTEGER |

---

## 🔐 Permissions

| Role | Can Use Month Filter | Can Use Staff Filter |
|------|---------------------|---------------------|
| Staff | ✅ Yes (own data only) | ❌ No |
| Manager | ✅ Yes | ✅ Yes |
| Director | ✅ Yes | ✅ Yes |
| Investor | ✅ Yes | ✅ Yes |

---

**Last Updated:** February 8, 2026  
**Version:** 1.0.0
