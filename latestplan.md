# Finspire - Latest Feature Plan

This document outlines the remaining planned enhancements for the Finspire application, expanded with details and ordered by estimated complexity (from least token-intensive/effort to most token-intensive).

## 1. Polish Nitty-Gritties & Housekeeping (Lowest Complexity)
**Overview:** Fix small behind-the-scenes (BTS) naming conventions and meta details to make the app feel professional.
**Details:** 
- Change the browser tab title from `client` to `Finspire`.
- Rename ambiguous route files like `Route1.jsx`, `Route2.jsx`, and `Route3.jsx` to descriptive names (e.g., `IncomeHistory.jsx`, `Forecasts.jsx`, `HealthDecisions.jsx`).
- Update internal router paths to match the new readable names.
- *Why lowest complexity?* This only requires simple string replacements and file renaming across the frontend.

## 2. Landing Page Enhancement
**Overview:** Overhaul the landing page to make a stronger first impression.
**Details:** 
- Refine the hero section with better copy, improved typography, and engaging visuals.
- Enhance the Neobrutalist design elements (sharper contrast, better drop shadows, interactive hover states).
- Optimize the layout for mobile responsiveness and ensure the value proposition (helping gig-workers manage volatile income) is instantly clear.
- *Complexity:* This is localized to a few frontend files (`LandingPage.jsx`, `index.css`) and requires no backend or database changes.

## 3. Smart Dashboard Prompts (Missing Data Reminders)
**Overview:** Proactively guide the user with smart, context-aware suggestions directly on the dashboard.
**Details:** 
- Implement logic to detect missing days of income data.
- Surface dynamic UI banners on the dashboard prompting the user with explicit calls to action (e.g., *"You haven't logged your income for Tuesday and Wednesday. Log it now to keep your forecasts accurate!"*).
- *Complexity:* Requires slight updates to the dashboard frontend to conditionally render the prompt and backend logic to scan the `DailyIncomeEntry` collection for date gaps.

## 4. App-Wide UI Enhancement
**Overview:** Polish the core application interface to make it feel modern, sleek, and cohesive.
**Details:**
- Standardize the design language across all dashboard routes (Menu, Income History, Forecasts, Health).
- Improve data visualizations (charts, gauges) to make them more interactive and visually appealing.
- Implement better empty states, loading skeletons, and error handling screens.
- *Complexity:* Requires touching multiple frontend components and CSS files, but relies on existing data structures.

## 5. Humanized & Insightful Financial Explanations
**Overview:** Transform raw financial metrics into empathetic, easily digestible, and actionable insights.
**Details:**
- Update the AI prompts in the backend (`aiExplanationService.js`) to adopt a warmer, more encouraging, and less rigid tone (e.g., "financial assistant" rather than "strict accountant").
- Instead of just displaying "Debt: 800,000 | Phase: Crisis", the app will explain: *"Your debt is currently eating up a large chunk of your income, making it hard to save. Let's focus on building a small Rs 10,000 safety net first so you aren't forced to take on more debt during slow weeks."*
- Redesign the insight cards on the frontend to present this text clearly.
- *Complexity:* Requires adjusting both backend LLM prompts and frontend rendering logic to handle richer text structures.

## 6. "Talk to Your Data" AI Chatbot (Highest Complexity)
**Overview:** A dedicated, interactive chat interface where users can ask specific questions about their finances.
**Details:**
- **Frontend:** Build a modern chat interface with message history, typing indicators, and quick-prompt suggestions (e.g., "Can I afford to take next Friday off?").
- **Backend:** Create a new conversational AI pipeline. The system will need to retrieve the user's specific `DailyIncomeEntry` history, `IncomeAnalytics`, and profile data, and inject it into the LLM's context window.
- **Capabilities:** The AI should be able to answer questions like: *"Why did my health score drop?"* or *"Based on my last 30 days, how much should I save this week?"*
- *Why highest complexity?* Requires building entirely new UI components, establishing new backend chat endpoints, managing conversation history/memory, and carefully engineering prompts so the AI accurately interprets the user's specific database records without hallucinating.