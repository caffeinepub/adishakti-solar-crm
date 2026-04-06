# Shree Adishakti Solar CRM

## Current State
New project. Only scaffold files exist. No application logic implemented.

## Requested Changes (Diff)

### Add
- Multi-user authentication with role-based access control (Admin, Sales Staff, Backend/Operations)
- User management: Admin can create/manage staff accounts with username + password
- Customer lead management: Sales staff can add customer details (name, phone, address, district, requirements)
- Pipeline tracking per customer: Inquiry → Survey Scheduled → Booking Confirmed → Installation → Closed Won / Closed Lost
- District assignment: Admin/backend team can assign customers to specific district sales persons
- Survey scheduling and booking/closing record entry per customer
- Dashboard with KPI overview: Total Leads, New Leads Today, Pending Survey, Installations/Closed
- Pipeline board view showing all stage columns with lead count badges
- Recent leads table with stage badges and action buttons
- Admin controls: manage users, view all leads, district settings
- Quick Actions panel: Add New Lead, Schedule Survey, Assign Leads
- District filter sidebar

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
1. User management: store users with roles (admin, sales, operations), username/password hash, district assignment
2. Customer/Lead model: id, name, phone, address, district, assignedSalesPersonId, stage, notes, createdAt, updatedAt
3. Pipeline stage enum: Inquiry, SurveyScheduled, BookingConfirmed, Installation, ClosedWon, ClosedLost
4. CRUD for leads with role-based access (sales can only see their own leads, admin/ops see all)
5. Lead assignment: assign lead to sales staff by district
6. Survey/booking/closing update entry per lead
7. KPI aggregation queries: total leads, leads today, pending survey count, closed count
8. District list management

### Frontend
1. Login page with username/password
2. Dashboard layout: top nav + left sidebar (districts) + main content + right panel
3. KPI tiles row (4 cards)
4. Pipeline Kanban-style board with stage columns
5. Recent leads table with filters
6. Add/Edit Lead modal form
7. Lead detail view with stage progression and notes
8. User management page (admin only)
9. District assignment UI
10. Role-based UI visibility (admin controls hidden from sales staff)
