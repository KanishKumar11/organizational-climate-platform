✅ 1. Figma Structure Blueprint (Master File Setup)
I will define the master structure for your Figma file so developers/designers can immediately work on it.

---

📌 Page Structure in Figma

1. Page 1 – Cover & Documentation
   o Frame 1: Cover with project name, version, and stakeholders.
   o Frame 2: Key design guidelines (color palette, typography, iconography).
   o Frame 3: Quick link map to all modules and screens.
2. Page 2 – Architecture & Workflow
   o Frame 1: System Architecture (modules + interactions).
   o Frame 2: Updated Workflow Diagram (AI feedback, tracking).
   o Frame 3: Component Map (widgets to be used across screens).
3. Page 3 – Wireframes (Low Fidelity)
   o Frame per Module:
    Login & Role Assignment.
    Dashboard Super Admin.
    Dashboard Company Admin.
    Dashboard Leader.
    Dashboard Supervisor.
    Employee Survey View.
    Action Plan Manager.
    AI Insights Panel.
    Microclimate Live Evaluation.
    Report Center.
4. Page 4 – UI Components Library
   o Buttons (primary, secondary, alert).
   o Cards (KPI, AI Recommendation, Action Plan).
   o Graphs (heatmap, progress bar, word cloud widget).
   o Modals (confirmation, AI suggestions).
5. Page 5 – High Fidelity UI Screens
   o Fully designed versions of each wireframe.
   o Incorporate branding (colors, logos, typography).
   o Apply interactions (hover, states).
6. Page 6 – Interactive Prototype
   o Link all high-fidelity screens to simulate user flows:
    Admin creating survey → Employee responding → AI analysis → Leader taking action.

---

✅ 2. Organization of Frames & Components
Frame Naming Convention
• [WF] → Wireframe
• [UI] → High Fidelity UI
• [C] → Component
• [D] → Diagram

---

Example:
yaml
CopyEdit
Page: Wireframes
Frame: [WF] Dashboard Super Admin
Frame: [WF] Survey Builder (Admin)
Frame: [WF] Microclimate Real-Time (Leader)
Frame: [WF] Action Plan & Follow-up

---

Design Grid & Layout
• Desktop resolution: 1440px width.
• Grid: 12 columns, 80px margin.
• Spacing: 8px/16px system.

---

✅ 3. Wireframes + Flow Interactive Guide
Here is the detailed flow of screens in Figma (to replicate developer flows):

---

Flow 1 – User Login & Role Assignment

1. [UI] Login
2. → [UI] Role Dashboard (different per user type)

---

Flow 2 – Admin: Survey Execution

1. [UI] Dashboard Company Admin
2. → [UI] Survey Builder
3. → [UI] Send Invitations
4. → [UI] AI Insights (after results)
5. → [UI] Action Plan Creation
6. → [UI] Tracking (KPIs + Feedback)
7. → [UI] Reporting

---

Flow 3 – Leader: Microclimate

1. [UI] Dashboard Leader
2. → [UI] Microclimate Launch
3. → [UI] Microclimate Live Results
4. → [UI] AI Insights Recommendations
5. → [UI] Adjust Action Plans

---

Flow 4 – AI Feedback & Continuous Loop

1. [UI] AI Insights Panel
2. → [UI] Action Plan Tracking
3. → [UI] Follow-up Microclimate Trigger
4. → [UI] Reports & Dashboards
5. → Return to AI Analysis → Loop continues

Figma Structure
📌 Figma Pages
Overview & Architecture
• General diagram (based on the developed workflow).
• Module map and their interactions.
Module Wireframes
• General Climate Survey (Survey Builder + Employee UI).
• Microclimates (Real-Time) (Mentimeter-style screen).
• AI Insights Panel (results + AI recommendations).
• Action Plan & Follow-up (creation, assignment, KPI & feedback tracking).
• Hierarchical Dashboards (views for Super Admin, Admin, Leader, Supervisor, Employee).
• Report Center (filters, downloads, dynamic charts).
Component Library
• Buttons, forms, cards, charts, notifications.
• Widgets for word clouds, heatmaps, progress bars, AI alerts.

---

✅ 2. Base Layout per Screen
Screen Key Elements in Figma
Login / Sign-Up SSO, role selection, corporate branding.
Main Dashboard Sidebar + Navbar, KPIs, AI alerts, interactive widgets.
Survey Builder Dynamic constructor, question blocks, conditional logic.
Survey Execution (Employee) Clean UI, Likert scales, conditional questions, progress tracking.
Microclimate Live Real-time visualization (word clouds, animated charts).
AI Insights Panel Cards with findings, recommendations, trends.
Action Plan Manager Action table, responsible parties, KPIs, status (color-coded).
Follow-up Tracking Qualitative views (comments) + quantitative views (progress %).
Reports Filters, export options, comparative charts.

---

✅ 3. Figma Flow (Prototype Links)
The Figma prototype should simulate:

1. Start → Login → Role-specific Dashboard.
2. Admin → Creates Survey → Launches → Employee responds → AI processes → Admin receives insights.
3. Leader → Launches Microclimate → Live results → AI recommends actions.
4. Admin/Leader → Creates Plans → Tracking (KPIs + feedback) → AI adjusts and triggers follow-up microclimate.
5. Super Admin → Compares Benchmarks → Downloads Reports.

---

✅ 4. Recommended Figma Plugins
• Charts for Figma: for dynamic charts.
• Figmotion: for animations (useful to simulate live microclimates).
• Content Reel: to generate test data (users, demographics).
• AI-powered Icons: for consistent icons.

---

🎨 5. Suggested Visual Style
• UI: Clean, modern, and professional (inspired by Duolingo + Power BI-style dashboards).
• Color coding by module:
o Surveys: Blue
o Microclimates: Green
o AI Insights: Violet
o Action Plans: Orange
• Typography: Inter / Roboto.
