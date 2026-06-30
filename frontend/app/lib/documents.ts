export type DocType =
  | 'mutual-nda'
  | 'pilot-agreement'
  | 'csa'
  | 'software-license'
  | 'partnership'
  | 'design-partner'
  | 'psa'
  | 'baa'
  | 'dpa'
  | 'sla'
  | 'ai-addendum';

export interface DocTypeInfo {
  id: DocType;
  name: string;
  description: string;
  buildPreview: (fields: Record<string, unknown>) => string;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmt(val: unknown, fallback = '—'): string {
  return typeof val === 'string' && val.trim() ? val : fallback;
}

function fmtDate(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return '—';
  const d = new Date(raw + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function partiesTable(
  fields: Record<string, unknown>,
  label1 = 'Provider',
  label2 = 'Customer',
): string {
  return `| | **${label1}** | **${label2}** |
|---|---|---|
| **Company** | ${fmt(fields.provider_company)} | ${fmt(fields.customer_company)} |
| **Signatory** | ${fmt(fields.provider_name)}${fields.provider_title ? `, ${fields.provider_title}` : ''} | ${fmt(fields.customer_name)}${fields.customer_title ? `, ${fields.customer_title}` : ''} |
| **Notice Address** | ${fmt(fields.provider_address)} | ${fmt(fields.customer_address)} |`;
}

function commonFooter(fields: Record<string, unknown>): string {
  return `**Governing Law:** ${fmt(fields.governing_law)}

**Jurisdiction:** ${fmt(fields.jurisdiction)}`;
}

function standardTermsNote(name: string): string {
  return `---\n\n*This document incorporates ${name} Standard Terms — [commonpaper.com](https://commonpaper.com)*`;
}

// ── NDA-specific (reuses existing logic) ─────────────────────────────────────

function buildNDAPreview(fields: Record<string, unknown>): string {
  const mndaTermType = fields.mnda_term_type as string || 'expires';
  const mndaYears = Number(fields.mnda_years) || 1;
  const confTermType = fields.conf_term_type as string || 'years';
  const confYears = Number(fields.conf_years) || 1;

  const mndaTerm = mndaTermType === 'expires'
    ? `Expires ${mndaYears} year(s) from Effective Date`
    : 'Continues until terminated';

  const confTerm = confTermType === 'perpetuity'
    ? 'In perpetuity'
    : `${confYears} year(s) from Effective Date`;

  return `# Mutual Non-Disclosure Agreement

### Purpose
${fmt(fields.purpose as string, '*[Not specified]*')}

### Effective Date
${fmtDate(fields.effective_date)}

### MNDA Term
${mndaTerm}

### Term of Confidentiality
${confTerm}

### Governing Law & Jurisdiction
**Governing Law:** ${fmt(fields.governing_law as string, '*[Not specified]*')}

**Jurisdiction:** ${fmt(fields.jurisdiction as string, '*[Not specified]*')}

### MNDA Modifications
${fmt(fields.modifications as string, '*None*')}

*By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.*

| | **Party 1** | **Party 2** |
|---|---|---|
| **Company** | ${fmt(fields.provider_company as string)} | ${fmt(fields.customer_company as string)} |
| **Print Name** | ${fmt(fields.provider_name as string)} | ${fmt(fields.customer_name as string)} |
| **Title** | ${fmt(fields.provider_title as string)} | ${fmt(fields.customer_title as string)} |
| **Notice Address** | ${fmt(fields.provider_address as string)} | ${fmt(fields.customer_address as string)} |
| **Signature** | | |
| **Date** | | |

---

## Standard Terms

1. **Introduction**. This MNDA allows each party to disclose confidential information for the **Purpose** stated above. Confidential Information means information identified as "confidential" or that should reasonably be understood as such.

2. **Use and Protection**. The Receiving Party shall use Confidential Information solely for the **Purpose**, not disclose it to third parties without prior written approval, and protect it with at least the same care it uses for its own similar information.

3. **Exceptions**. Obligations do not apply to information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was rightfully known before disclosure; (c) was received without restriction from an authorized third party; or (d) was independently developed.

4. **Term**. This MNDA commences on the **Effective Date**, expires at the end of the **MNDA Term**, and confidentiality obligations survive for the **Term of Confidentiality**.

5. **Governing Law**. This MNDA is governed by the laws of **${fmt(fields.governing_law as string, '[State]')}**. Disputes shall be resolved in courts located in **${fmt(fields.jurisdiction as string, '[Jurisdiction]')}**.

*Common Paper Mutual NDA Version 1.0 — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)*`;
}

// ── Generic builders ──────────────────────────────────────────────────────────

function buildPilotPreview(fields: Record<string, unknown>): string {
  return `# Pilot Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}
**Pilot Period:** ${fmt(fields.pilot_period)}

## Parties

${partiesTable(fields)}

## Key Terms

**Product:** ${fmt(fields.product_description)}

**Evaluation Purpose:** Customer may access and use the Product solely to evaluate whether to enter into a longer-term agreement.

**Fees:** No fees during the Pilot Period.

**General Liability Cap:** ${fmt(fields.general_cap_amount)}

${commonFooter(fields)}

${standardTermsNote('Pilot Agreement')}`;
}

function buildCSAPreview(fields: Record<string, unknown>): string {
  return `# Cloud Service Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}
**Subscription Period:** ${fmt(fields.subscription_period)}

## Parties

${partiesTable(fields)}

## Key Terms

**Cloud Service:** ${fmt(fields.product_description)}

**Technical Support:** ${fmt(fields.support_tiers)}

**Fees:** ${fmt(fields.fees)}

**Payment Terms:** ${fmt(fields.payment_terms)}

**General Liability Cap:** ${fmt(fields.general_cap_amount)}

${commonFooter(fields)}

${standardTermsNote('Cloud Service Agreement')}`;
}

function buildSoftwareLicensePreview(fields: Record<string, unknown>): string {
  return `# Software License Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}
**Subscription Period:** ${fmt(fields.subscription_period)}

## Parties

${partiesTable(fields)}

## Key Terms

**Software:** ${fmt(fields.product_description)}

**Permitted Uses:** ${fmt(fields.permitted_uses)}

**Fees:** ${fmt(fields.fees)}

**Payment Terms:** ${fmt(fields.payment_terms)}

**General Liability Cap:** ${fmt(fields.general_cap_amount)}

${commonFooter(fields)}

${standardTermsNote('Software License Agreement')}`;
}

function buildPartnershipPreview(fields: Record<string, unknown>): string {
  return `# Partnership Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}
**Term:** ${fmt(fields.term_length)}

## Parties

${partiesTable(fields, 'Party 1', 'Party 2')}

## Key Terms

**Obligations:**
${fmt(fields.obligations)}

${commonFooter(fields)}

${standardTermsNote('Partnership Agreement')}`;
}

function buildDesignPartnerPreview(fields: Record<string, unknown>): string {
  return `# Design Partner Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}
**Term:** ${fmt(fields.term_length)}

## Parties

${partiesTable(fields, 'Provider', 'Partner')}

## Key Terms

**Product:** ${fmt(fields.product_description)}

**Program:** ${fmt(fields.program_description)}

${commonFooter(fields)}

${standardTermsNote('Design Partner Agreement')}`;
}

function buildPSAPreview(fields: Record<string, unknown>): string {
  return `# Professional Services Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}

## Parties

${partiesTable(fields)}

## Key Terms

**Services:** ${fmt(fields.services_description)}

**Fees:** ${fmt(fields.fees)}

**Payment Terms:** ${fmt(fields.payment_terms)}

**General Liability Cap:** ${fmt(fields.general_cap_amount)}

${commonFooter(fields)}

${standardTermsNote('Professional Services Agreement')}`;
}

function buildBAAPreview(fields: Record<string, unknown>): string {
  return `# Business Associate Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}

## Parties

${partiesTable(fields, 'Business Associate (Provider)', 'Covered Entity (Customer)')}

## Key Terms

**PHI Types:** ${fmt(fields.phi_types)}

**Permitted Uses of PHI:** ${fmt(fields.phi_permitted_uses)}

${commonFooter(fields)}

${standardTermsNote('Business Associate Agreement')}`;
}

function buildDPAPreview(fields: Record<string, unknown>): string {
  return `# Data Processing Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}

## Parties

${partiesTable(fields, 'Controller', 'Processor')}

## Key Terms

**Personal Data Types:** ${fmt(fields.data_types)}

**Processing Purposes:** ${fmt(fields.processing_purposes)}

${commonFooter(fields)}

${standardTermsNote('Data Processing Agreement')}`;
}

function buildSLAPreview(fields: Record<string, unknown>): string {
  return `# Service Level Agreement

**Effective Date:** ${fmtDate(fields.effective_date)}

## Parties

${partiesTable(fields)}

## Key Terms

**Target Uptime:** ${fmt(fields.target_uptime)}

**Support Tiers & Response Times:**
${fmt(fields.support_tiers)}

${commonFooter(fields)}

${standardTermsNote('Service Level Agreement')}`;
}

function buildAIAddendumPreview(fields: Record<string, unknown>): string {
  return `# AI Addendum

**Effective Date:** ${fmtDate(fields.effective_date)}
**Parent Agreement:** ${fmt(fields.parent_agreement)}

## Parties

${partiesTable(fields)}

## Key Terms

**AI Services:** ${fmt(fields.ai_service_description)}

**Customer Obligations:** Customer will not use AI Services for decision-making in regulated industries without proper human oversight, will not violate third-party intellectual property rights, and will not represent AI-generated Output as created by a human.

${commonFooter(fields)}

${standardTermsNote('AI Addendum')}`;
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const DOCUMENT_TYPES: DocTypeInfo[] = [
  {
    id: 'mutual-nda',
    name: 'Mutual NDA',
    description: 'Both parties share confidential information',
    buildPreview: buildNDAPreview,
  },
  {
    id: 'pilot-agreement',
    name: 'Pilot Agreement',
    description: 'Customer evaluates a product for free before committing',
    buildPreview: buildPilotPreview,
  },
  {
    id: 'csa',
    name: 'Cloud Service Agreement',
    description: 'Ongoing SaaS/cloud access subscription',
    buildPreview: buildCSAPreview,
  },
  {
    id: 'software-license',
    name: 'Software License Agreement',
    description: 'Customer licenses software to install and use',
    buildPreview: buildSoftwareLicensePreview,
  },
  {
    id: 'partnership',
    name: 'Partnership Agreement',
    description: 'Two parties cooperate on a joint initiative',
    buildPreview: buildPartnershipPreview,
  },
  {
    id: 'design-partner',
    name: 'Design Partner Agreement',
    description: 'Early customer gives feedback to help build a product',
    buildPreview: buildDesignPartnerPreview,
  },
  {
    id: 'psa',
    name: 'Professional Services Agreement',
    description: 'Provider performs custom services or consulting',
    buildPreview: buildPSAPreview,
  },
  {
    id: 'baa',
    name: 'Business Associate Agreement',
    description: 'HIPAA-required agreement for handling health data (PHI)',
    buildPreview: buildBAAPreview,
  },
  {
    id: 'dpa',
    name: 'Data Processing Agreement',
    description: 'GDPR/CCPA agreement for processing personal data',
    buildPreview: buildDPAPreview,
  },
  {
    id: 'sla',
    name: 'Service Level Agreement',
    description: 'Defines uptime guarantees and support response times',
    buildPreview: buildSLAPreview,
  },
  {
    id: 'ai-addendum',
    name: 'AI Addendum',
    description: 'Adds AI-service-specific terms to an existing agreement',
    buildPreview: buildAIAddendumPreview,
  },
];

export function getDocTypeInfo(id: string): DocTypeInfo | undefined {
  return DOCUMENT_TYPES.find(d => d.id === id);
}
