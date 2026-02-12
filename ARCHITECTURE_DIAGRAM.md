# Architecture Diagram - Month Filtering System

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Quotations Page UI                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │  │
│  │  │   Month    │  │    Year    │  │  Staff Filter    │  │  │
│  │  │  Dropdown  │  │  Selector  │  │  (Mgr/Director)  │  │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘  │  │
│  │         │              │                   │            │  │
│  │         └──────────────┴───────────────────┘            │  │
│  │                        │                                │  │
│  │                        ▼                                │  │
│  │              [Quotations List]                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ React Query
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REACT QUERY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  useQuotationsQuery(filterUserId, month, year)                 │
│  ├─ Query Key: ['quotations', userId, filterUserId, month, year]│
│  ├─ Caching: 5 minutes                                          │
│  ├─ Refetch: On window focus (disabled)                         │
│  └─ Retry: 3 times                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP GET
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API ROUTE LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /api/quotations?month=3&year=2026&filterUserId=xxx        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. Extract query parameters                               │ │
│  │    - month: 1-12 or 'all'                                 │ │
│  │    - year: YYYY                                            │ │
│  │    - filterUserId: UUID (optional)                         │ │
│  │                                                            │ │
│  │ 2. Validate parameters                                     │ │
│  │    - month >= 1 && month <= 12                            │ │
│  │    - year > 2000                                           │ │
│  │                                                            │ │
│  │ 3. Build date range                                        │ │
│  │    - startDate: YYYY-MM-01T00:00:00.000Z                  │ │
│  │    - endDate: YYYY-MM-31T23:59:59.999Z                    │ │
│  │                                                            │ │
│  │ 4. Apply filters to Supabase query                         │ │
│  │    - .gte('created_at', startDate)                         │ │
│  │    - .lte('created_at', endDate)                           │ │
│  │                                                            │ │
│  │ 5. Return filtered results                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase Client
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Table: quotations                                              │
│  ┌──────────────┬──────────────┬─────────────────────────────┐ │
│  │ id (UUID)    │ customer_name│ created_at (TIMESTAMPTZ)    │ │
│  ├──────────────┼──────────────┼─────────────────────────────┤ │
│  │ abc-123      │ John Doe     │ 2026-03-15T10:30:00.000Z    │ │
│  │ def-456      │ Jane Smith   │ 2026-03-20T14:45:00.000Z    │ │
│  │ ghi-789      │ Bob Johnson  │ 2026-04-05T09:15:00.000Z    │ │
│  └──────────────┴──────────────┴─────────────────────────────┘ │
│                                                                 │
│  Query: SELECT * FROM quotations                                │
│         WHERE created_at >= '2026-03-01T00:00:00.000Z'          │
│           AND created_at <= '2026-03-31T23:59:59.999Z'          │
│         ORDER BY created_at DESC                                │
│                                                                 │
│  Result: Returns rows 1 and 2 (March 2026)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
User Action                React Query              API Route              Database
    │                          │                        │                      │
    │ 1. Select "March"        │                        │                      │
    ├─────────────────────────>│                        │                      │
    │                          │                        │                      │
    │                          │ 2. Check cache         │                      │
    │                          │    (cache miss)        │                      │
    │                          │                        │                      │
    │                          │ 3. GET /api/quotations │                      │
    │                          │    ?month=3&year=2026  │                      │
    │                          ├───────────────────────>│                      │
    │                          │                        │                      │
    │                          │                        │ 4. Parse params      │
    │                          │                        │    month = 3         │
    │                          │                        │    year = 2026       │
    │                          │                        │                      │
    │                          │                        │ 5. Build date range  │
    │                          │                        │    start: 2026-03-01 │
    │                          │                        │    end: 2026-03-31   │
    │                          │                        │                      │
    │                          │                        │ 6. Query Supabase    │
    │                          │                        ├─────────────────────>│
    │                          │                        │                      │
    │                          │                        │                      │ 7. Filter rows
    │                          │                        │                      │    by created_at
    │                          │                        │                      │
    │                          │                        │ 8. Return results    │
    │                          │                        │<─────────────────────┤
    │                          │                        │                      │
    │                          │ 9. JSON response       │                      │
    │                          │<───────────────────────┤                      │
    │                          │                        │                      │
    │                          │ 10. Cache results      │                      │
    │                          │     (5 min TTL)        │                      │
    │                          │                        │                      │
    │ 11. Update UI            │                        │                      │
    │<─────────────────────────┤                        │                      │
    │                          │                        │                      │
    │ 12. Display filtered     │                        │                      │
    │     quotations           │                        │                      │
    │                          │                        │                      │
```

---

## Navigation Structure (After Changes)

```
┌─────────────────────────────────────────────────────────────────┐
│                         KSM.ART HOUSE                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                    ┌──────────────────┐
│  Director/    │                    │  Staff/Manager   │
│  Investor     │                    │                  │
└───────────────┘                    └──────────────────┘
        │                                       │
        │                                       │
        ▼                                       ▼
┌───────────────┐                    ┌──────────────────┐
│   Dashboard   │                    │  Redirect to     │
│   (/)         │                    │  /events         │
└───────────────┘                    └──────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         OPERATIONS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Events    │  │     Gym      │  │  Restaurant  │         │
│  │  Management  │  │  Management  │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐                                              │
│  │  Sauna & Spa │                                              │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT RELATIONS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Customer Database                           │  │
│  │  (Decor Allocations - Already has month filtering)      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filter State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    QuotationManager Component                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State:                                                         │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ selectedMonth: number | 'all' = 'all'                      ││
│  │ selectedYear: number = new Date().getFullYear()            ││
│  │ filterUserId: string | null = null                         ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Effects:                                                       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ When month changes → Trigger refetch                       ││
│  │ When year changes → Trigger refetch                        ││
│  │ When filterUserId changes → Trigger refetch                ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Query:                                                         │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ useQuotations(filterUserId, selectedMonth, selectedYear)   ││
│  │   ↓                                                         ││
│  │ useQuotationsQuery(filterUserId, selectedMonth, selectedYear)│
│  │   ↓                                                         ││
│  │ useQuery({                                                  ││
│  │   queryKey: ['quotations', userId, filterUserId,           ││
│  │              selectedMonth, selectedYear],                  ││
│  │   queryFn: () => fetch(...)                                ││
│  │ })                                                          ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

```
React Query Cache:
┌─────────────────────────────────────────────────────────────────┐
│ Key: ['quotations', 'user-123', null, 'all', 2026]             │
│ Data: [all quotations for 2026]                                │
│ TTL: 5 minutes                                                  │
│ Status: fresh                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Key: ['quotations', 'user-123', null, 3, 2026]                 │
│ Data: [quotations for March 2026]                              │
│ TTL: 5 minutes                                                  │
│ Status: fresh                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Key: ['quotations', 'user-123', 'staff-456', 3, 2026]          │
│ Data: [quotations for March 2026 by staff-456]                 │
│ TTL: 5 minutes                                                  │
│ Status: fresh                                                   │
└─────────────────────────────────────────────────────────────────┘

Benefits:
✅ Different filter combinations cached separately
✅ No unnecessary API calls for same filter
✅ Instant response when switching back to previous filter
✅ Automatic cache invalidation after 5 minutes
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** February 8, 2026
