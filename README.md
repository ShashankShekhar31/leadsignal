# LeadSignal — Lead Qualification & Prioritization

LeadSignal is a lightweight lead-qualification prototype built for the Caprae Capital AI-Readiness Pre-Screening Challenge. It helps a sales team turn a CSV of company prospects into a prioritized list using transparent, explainable fit scores.

> **Prototype boundary:** This project does not scrape SaaSquatch Leads or other websites, verify email addresses, retrieve live company data, predict buying intent, or connect to a CRM. The dashboard starts with synthetic sample records and can process a user-provided CSV locally in the browser.

## Features

- **CSV import:** Load a CSV of company prospects.
- **Explainable lead scoring:** Scores are based on target industry, employee count, revenue, website presence, and email presence.
- **Duplicate detection:** Company names are normalized by lowercasing and removing non-alphanumeric characters. Matching normalized names are flagged; records are not automatically deleted.
- **Search and filtering:** Search company, industry, location, or email; filter by priority.
- **Sorting:** Sort by best-fit score or company name.
- **CSV export:** Export the currently filtered lead list, including scores, priority, duplicate status, and score reasons.
- **Import safeguards:** An invalid record such as a missing company name is rejected without replacing the existing in-memory dataset.
- **Local processing:** Uploaded CSV contents are processed in the browser; the app does not send them to a backend service.

## Lead scoring

The current heuristic starts at zero and adds points when a record matches these rules:

| Signal | Points | Rule |
| --- | ---: | --- |
| Target technology industry | +35 | Industry contains “software”, “technology”, or “saas” (case-insensitive) |
| Company size | +25 | Employee count is between 50 and 500 inclusive |
| Revenue | +25 | Revenue is between 5 and 100 inclusive, expressed in millions |
| Website present | +5 | Website field is non-empty |
| Email present | +10 | Email field is non-empty |
| Duplicate normalized company name | −30 | Two or more records normalize to the same company key |

Scores are clamped to 0–100. Priority is **High** at 75–100, **Medium** at 50–74, and **Low** below 50.

These weights and thresholds are explicit prototype assumptions, not a validated sales model. A score describes fit against the rules above; it is not evidence of purchase intent. Website and email presence are not verification.

## CSV format

The importer accepts a header row and at least one data row. Headers are normalized to lowercase and spaces/hyphens become underscores. Supported aliases include:

| Field | Accepted headers |
| --- | --- |
| Company name (required) | `company`, `company_name`, `name`, `organization` |
| Industry | `industry`, `sector` |
| Location | `location`, `city`, `headquarters` |
| Employees | `employees`, `employee_count`, `employees_count` |
| Revenue in millions | `revenue_m`, `revenue`, `annual_revenue` |
| Website/domain | `website`, `domain`, `url` |
| Email | `email`, `contact_email`, `business_email` |

Example:

```csv
company,industry,location,employees,revenue_m,website,email
Meridian AI,Software,New York,120,18,meridian.example,sales@meridian.example
Corner Bakery,Retail,Denver,8,0,,
```

Numbers for revenue should be in millions. The prototype treats missing numeric values as zero. Invalid negative or non-numeric numeric values are rejected. The parser supports quoted fields, commas inside quoted values, and escaped double quotes. It rejects unclosed quoted fields and duplicate/empty headers.

The sample domains and addresses above use the reserved `.example` namespace and are placeholders, not live prospects.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS (Vite plugin)
- Lucide React icons
- Vitest for automated unit tests
- ESLint for linting

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Quality checks

```bash
npm run lint
npm test
npm run build
```

Unit tests cover scoring, normalized duplicate detection, score bounds, quoted CSV values, escaped quotes, unclosed quotes, duplicate headers, missing company names, and invalid numeric input.

## Architecture and data handling

This is a **client-side prototype**. Vite builds the static frontend; React maintains the active lead list in memory for the current browser session; the lead engine parses CSV input and computes scores in the browser. There is no API server, database, cache, queue, or external enrichment service in this version. Data is not persisted across reloads, and the UI should not be described as a multi-user workspace.

For a small prototype, local processing keeps deployment and setup simple and avoids uploading prospect data to an unnecessary service. For production, a next iteration could add explicit user-controlled persistence, authenticated workspaces, robust CSV size limits, validated enrichment providers, and CRM integration, with access controls and retention policies designed before storing contact data.

## Deployment

The app can be hosted as static assets on a static hosting provider. Build with `npm run build`; the deployable files are generated in `dist/`. No server-side secrets are required for this prototype. Configure the host to serve `index.html` for the root route.

- **Live demo:** Not deployed yet.

## Limitations

- No live scraping or SaaSquatch integration.
- No live enrichment, email verification, CRM sync, or automated outreach.
- The scoring model is heuristic and not calibrated against conversion outcomes.
- Duplicate detection uses normalized company names only; it does not reconcile subsidiaries or domain aliases.
- Imported data is in-memory and is lost on page refresh.
- Sample companies and contact details are synthetic placeholders.

## Assessment rationale

The feature choice focuses on helping a user prioritize a smaller set of potentially relevant prospects rather than simply collecting more records. Transparent scoring reasons, duplicate flags, import validation, search/filter controls, and export support a basic sales workflow. This prototype demonstrates the workflow with local/sample data; it does not claim the full extraction or enrichment capabilities of the reference product.

## License

No license has been added yet. Unless a license is chosen, reuse permissions should not be assumed.
