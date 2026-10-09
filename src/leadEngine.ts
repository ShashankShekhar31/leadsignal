export type LeadPriority = "High" | "Medium" | "Low";

export type Lead = {
  id: string;
  company: string;
  industry: string;
  location: string;
  employees: number;
  revenue: number;
  website: string;
  email: string;
  score: number;
  priority: LeadPriority;
  reasons: string[];
  duplicate: boolean;
};

export function normalizeCompany(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function scoreLeads(leads: Lead[]): Lead[] {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const key = normalizeCompany(lead.company);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return leads.map((lead) => {
    let score = 0;
    const reasons: string[] = [];
    const industry = lead.industry.trim().toLowerCase();

    // Industry fit
    if (
      industry.includes("software") ||
      industry.includes("technology") ||
      industry.includes("saas")
    ) {
      score += 35;
      reasons.push("Target technology industry (+35)");
    }

    // Employee-count fit
    if (lead.employees >= 50 && lead.employees <= 500) {
      score += 25;
      reasons.push("Target company size (+25)");
    } else if (
      (lead.employees >= 20 && lead.employees < 50) ||
      (lead.employees > 500 && lead.employees <= 1000)
    ) {
      score += 10;
      reasons.push("Adjacent company size (+10)");
    }

    // Revenue fit, expressed in millions
    if (lead.revenue >= 5 && lead.revenue <= 100) {
      score += 25;
      reasons.push("Target revenue range (+25)");
    } else if (
      (lead.revenue >= 1 && lead.revenue < 5) ||
      (lead.revenue > 100 && lead.revenue <= 250)
    ) {
      score += 10;
      reasons.push("Adjacent revenue range (+10)");
    }

    // Contact-data completeness
    if (lead.website.trim()) {
      score += 5;
      reasons.push("Website available (+5)");
    }

    if (lead.email.trim()) {
      score += 10;
      reasons.push("Email provided (+10)");
    }

    // Duplicate penalty
    const key = normalizeCompany(lead.company);
    const duplicate = key !== "" && (counts.get(key) ?? 0) > 1;

    if (duplicate) {
      score -= 30;
      reasons.push("Duplicate company name (-30)");
    }

    score = Math.max(0, Math.min(100, score));

    const priority: LeadPriority =
      score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";

    return { ...lead, score, reasons, duplicate, priority };
  });
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"' && quoted && text[i + 1] === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted field.");

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);

  if (rows.length < 2) {
    throw new Error("CSV must contain a header and at least one data row.");
  }

  const headers = rows[0].map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_"),
  );

  if (headers.some((header) => !header)) {
    throw new Error("CSV contains an empty column name.");
  }

  if (new Set(headers).size !== headers.length) {
    throw new Error("CSV contains duplicate column names.");
  }

  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
}

export function toLead(row: Record<string, string>, index: number): Lead {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      if (row[key] !== undefined) return row[key].trim();
    }
    return "";
  };

  const company = pick("company", "company_name", "name", "organization");

  if (!company) {
    throw new Error(`Row ${index + 2} is missing a company name.`);
  }

  const number = (value: string, field: string) => {
    if (!value) return 0;

    const parsed = Number(value.replace(/[$,%\s]/g, ""));

    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error(`Row ${index + 2} has an invalid ${field} value.`);
    }

    return parsed;
  };

  return {
    id: `import-${index}-${company}`,
    company,
    industry: pick("industry", "sector"),
    location: pick("location", "city", "headquarters"),
    employees: number(
      pick("employees", "employee_count", "employees_count"),
      "employees",
    ),
    revenue: number(pick("revenue_m", "revenue", "annual_revenue"), "revenue"),
    website: pick("website", "domain", "url"),
    email: pick("email", "contact_email", "business_email"),
    score: 0,
    priority: "Low",
    reasons: [],
    duplicate: false,
  };
}
