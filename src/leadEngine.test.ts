import { describe, expect, it } from "vitest";
import { parseCsv, scoreLeads, toLead, type Lead } from "./leadEngine";

function makeLead(company: string, overrides: Partial<Lead> = {}): Lead {
  return {
    id: company,
    company,
    industry: "Software",
    location: "New York",
    employees: 120,
    revenue: 18,
    website: "company.example",
    email: "contact@company.example",
    score: 0,
    priority: "Low",
    reasons: [],
    duplicate: false,
    ...overrides,
  };
}

describe("scoreLeads", () => {
  it("gives a complete target-fit company 100 points", () => {
    const [lead] = scoreLeads([makeLead("Meridian AI")]);

    expect(lead.score).toBe(100);
    expect(lead.priority).toBe("High");
    expect(lead.duplicate).toBe(false);
  });

  it("scores a company with no matching signals at zero", () => {
    const [lead] = scoreLeads([
      makeLead("Corner Bakery", {
        industry: "Retail",
        employees: 8,
        revenue: 0,
        website: "",
        email: "",
      }),
    ]);

    expect(lead.score).toBe(0);
    expect(lead.priority).toBe("Low");
  });

  it("flags normalized duplicate names and applies the penalty", () => {
    const [first, second] = scoreLeads([
      makeLead("Apex Cloud"),
      makeLead("Apex-Cloud"),
    ]);

    expect(first.duplicate).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(first.score).toBe(70);
    expect(second.score).toBe(70);
  });

  it("clamps scores to the supported range", () => {
    const [lead] = scoreLeads([
      makeLead("No Signals", {
        industry: "Retail",
        employees: 0,
        revenue: 0,
        website: "",
        email: "",
      }),
    ]);

    expect(lead.score).toBeGreaterThanOrEqual(0);
    expect(lead.score).toBeLessThanOrEqual(100);
  });
});

describe("parseCsv and toLead", () => {
  it("parses quoted values containing commas", () => {
    const rows = parseCsv('company,location\n"Acme, Inc.","New York, US"\n');

    expect(rows[0].company).toBe("Acme, Inc.");
    expect(rows[0].location).toBe("New York, US");
  });

  it("supports escaped quotes inside a quoted field", () => {
    const rows = parseCsv('company,industry\n"Acme ""North"" Inc.",Software\n');

    expect(rows[0].company).toBe('Acme "North" Inc.');
  });

  it("rejects an unclosed quoted field", () => {
    expect(() => parseCsv('company,industry\n"Acme,Software')).toThrow(
      /unclosed quoted field/i,
    );
  });

  it("rejects duplicate headers", () => {
    expect(() => parseCsv("company,company\nAcme,Acme")).toThrow(
      /duplicate column names/i,
    );
  });

  it("rejects rows without a company name", () => {
    const rows = parseCsv("company,industry\n,Software");

    expect(() => toLead(rows[0], 0)).toThrow(/missing a company name/i);
  });

  it("rejects invalid numeric values", () => {
    expect(() =>
      toLead(
        {
          company: "Acme",
          employees: "many",
        },
        0,
      ),
    ).toThrow(/invalid employees value/i);
  });

  it("gives partial credit to adjacent employee and revenue ranges", () => {
    const [lead] = scoreLeads([
      makeLead("Growing Startup", {
        industry: "Software",
        employees: 35,
        revenue: 3,
      }),
    ]);

    expect(lead.score).toBe(70);
    expect(lead.priority).toBe("Medium");
    expect(lead.reasons).toContain("Adjacent company size (+10)");
    expect(lead.reasons).toContain("Adjacent revenue range (+10)");
  });
});
