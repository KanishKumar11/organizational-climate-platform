✅ FITMAP – Figma Implementation Map
Below is the full FITMAP describing how the Figma project should be structured, what each frame contains, and how they connect. This is the master guide your developers/designers can follow to build the Figma prototype.

---

🎯 1. FITMAP: Structure and Content
📌 Page 1: Cover & Documentation
• Frame [COVER]
o Project name, version, stakeholders.
• Frame [GUIDELINES]
o Colors: Blue (#1E90FF), Orange (#FFA500), Green (#4CAF50), Violet (#7A42F4).
o Typography: Inter / Roboto.
o Icon Set: AI-driven flat icons.
• Frame [LINK MAP]
o Clickable navigation to other pages.

---

📌 Page 2: Architecture & Workflow
• Frame [D1] System Workflow Diagram
o Insert Final Technical Workflow (AI cycle + Follow-up).
• Frame [D2] Modules Interaction Map
o Boxes for each module (Surveys, Microclimates, Action Plans, AI Engine, Reports) with directional flows.
• Frame [D3] Component Map
o Library of reusable elements: cards, widgets, charts, modals.

---

📌 Page 3: Wireframes (Low Fidelity)
Each wireframe should be clean and functional, showing layout and navigation only.

1. [WF] Login & Role Assignment
   o Username/password + SSO.
   o Role selection redirection.
2. [WF] Dashboard Super Admin
   o Sidebar, KPIs, global alerts, benchmark overview.
3. [WF] Dashboard Company Admin
   o Company KPIs, AI alerts, survey launch.
4. [WF] Dashboard Leader
   o Department-specific KPIs, microclimate launch.
5. [WF] Microclimate Real-Time
   o Live results: word cloud, heatmaps, bar charts.
6. [WF] AI Insights Panel
   o AI-generated findings, risk alerts, recommended actions.
7. [WF] Action Plan & Follow-up
   o List of actions, KPIs, qualitative objectives, progress bars.
8. [WF] Report Center
   o Filters (demographics), download options, AI summaries.

---

📌 Page 4: UI Components Library
• Buttons: Primary, Secondary, Alert.
• Cards: KPI Card, AI Recommendation, Action Plan Card.
• Charts: Heatmap, Word Cloud, Progress Bars.
• Modals: Confirmation, AI Suggestion Popup.
• Notifications: Smart nudges, reminders.

---

📌 Page 5: High Fidelity UI Screens
Same as wireframes but with:
• Branding (colors, logos).
• Realistic data (mocked for demo).
• Responsive states (desktop/tablet).
• Role-based variations.

---

📌 Page 6: Interactive Prototype
• Link screens to simulate flows:
o Admin → Creates Survey → Employee Responds → AI Analysis → Leader Executes Action Plan → AI Feedback Loop → Reports.

---

🎨 2. Developer Guidelines for Figma
Naming Convention
• Use clear tags:
o [WF] = Wireframe
o [UI] = High Fidelity UI
o [C] = Component
o [D] = Diagram

---

Interaction Guidelines
• Prototype Links:
o Login → Role Dashboard.
o Dashboard → Survey Builder → AI Insights → Action Plans.
o Action Plan → Tracking → AI Feedback → Microclimate Follow-up.

---

Design Tokens
• Spacing: 8px grid.
• Font sizes: H1 = 32px, H2 = 24px, Body = 16px.
• Button sizes: 48px height, radius 4px.

---

Animation Suggestions
• Microclimate Live → Animate word clouds & charts.
• AI Insights → Fade-in cards with recommendations.
• Action Plan Tracking → Progress bar animation.
