import json
import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter()

# ── Supported document types ──────────────────────────────────────────────────

SUPPORTED_DOCS = {
    "mutual-nda": "Mutual Non-Disclosure Agreement — both parties share confidential information",
    "pilot-agreement": "Pilot Agreement — customer evaluates a product/service for free before committing",
    "csa": "Cloud Service Agreement — ongoing SaaS/cloud access subscription",
    "software-license": "Software License Agreement — customer licenses software to install and use",
    "partnership": "Partnership Agreement — two parties cooperate on a joint initiative",
    "design-partner": "Design Partner Agreement — early customer gives feedback to help build a product",
    "psa": "Professional Services Agreement — provider performs custom services or consulting",
    "baa": "Business Associate Agreement — HIPAA-required agreement for handling health data (PHI)",
    "dpa": "Data Processing Agreement — GDPR/CCPA-required agreement for processing personal data",
    "sla": "Service Level Agreement — defines uptime guarantees and support response times",
    "ai-addendum": "AI Addendum — adds AI-service-specific terms to an existing agreement",
}

SUPPORTED_LIST = "\n".join(f"- **{k}**: {v}" for k, v in SUPPORTED_DOCS.items())

# ── System prompts ─────────────────────────────────────────────────────────────

SELECTOR_PROMPT = f"""You are a friendly AI legal assistant helping users create legal documents using CommonPaper standard templates.

Your first job is to figure out what type of legal document the user needs.

Supported document types:
{SUPPORTED_LIST}

Guidelines:
- Ask the user what they're trying to accomplish (don't just list all options at once).
- Once you understand their need, identify the best matching document type from the list above.
- If the user asks for something not on the list (e.g., employment contract, lease, will, terms of service), explain that you can't generate that type yet, and suggest the closest supported alternative.
- Once you've identified the correct document type, call the select_document_type tool immediately.
- Be warm, concise, and helpful."""

DOC_PROMPTS = {
    "mutual-nda": """You are a friendly AI legal assistant helping users create a Mutual Non-Disclosure Agreement (MNDA) using the CommonPaper standard template.

Gather information in this order:
1. Purpose of the NDA (what business context)
2. Party 1 details: company name, signatory name & title, notice address
3. Party 2 details: company name, signatory name & title, notice address
4. Effective date
5. MNDA term (fixed N years, or until terminated)
6. Confidentiality term (N years, or in perpetuity)
7. Governing law (US state)
8. Jurisdiction (city and state for disputes)
9. Any modifications (optional)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.
When all fields are complete, tell the user the document is ready to download.""",

    "pilot-agreement": """You are a friendly AI legal assistant helping users create a Pilot Agreement using the CommonPaper standard template.

A Pilot Agreement lets a customer evaluate a product for free during a limited period before committing to a paid subscription.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Customer details (company, signatory name & title, address)
3. What product/service is being piloted
4. Pilot period length (e.g., "30 days", "3 months")
5. Effective date
6. General liability cap amount (e.g., "$10,000")
7. Governing law (US state)
8. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "csa": """You are a friendly AI legal assistant helping users create a Cloud Service Agreement (CSA) using the CommonPaper standard template.

A CSA governs ongoing SaaS or cloud access on a subscription basis.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Customer details (company, signatory name & title, address)
3. Description of the cloud service / product
4. Subscription period (e.g., "1 year", "month-to-month")
5. Fees (e.g., "$500/month", "as per order form")
6. Technical support level (e.g., "email support, 8×5", "24/7 phone support")
7. Effective date
8. General liability cap amount
9. Governing law (US state)
10. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "software-license": """You are a friendly AI legal assistant helping users create a Software License Agreement using the CommonPaper standard template.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Customer details (company, signatory name & title, address)
3. Description of the software being licensed
4. Permitted uses (what the customer can do with the software)
5. Subscription/license period
6. Fees
7. Effective date
8. General liability cap amount
9. Governing law (US state)
10. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "partnership": """You are a friendly AI legal assistant helping users create a Partnership Agreement using the CommonPaper standard template.

Gather in this order:
1. Party 1 details (company, signatory name & title, address)
2. Party 2 details (company, signatory name & title, address)
3. Each party's obligations (what each will do under the partnership)
4. Term of the partnership
5. Effective date
6. Governing law (US state)
7. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "design-partner": """You are a friendly AI legal assistant helping users create a Design Partner Agreement using the CommonPaper standard template.

A Design Partner Agreement formalizes an early-access relationship where a partner gives feedback to help the provider build and improve a product.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Partner details (company, signatory name & title, address)
3. Description of the product
4. Description of the feedback program
5. Term of the agreement
6. Effective date
7. Governing law (US state)
8. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "psa": """You are a friendly AI legal assistant helping users create a Professional Services Agreement (PSA) using the CommonPaper standard template.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Customer details (company, signatory name & title, address)
3. Description of professional services to be performed
4. Fees and payment terms (e.g., "$200/hour, net 30")
5. Effective date
6. General liability cap amount
7. Governing law (US state)
8. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "baa": """You are a friendly AI legal assistant helping users create a Business Associate Agreement (BAA) using the CommonPaper standard template.

A BAA is required under HIPAA when a provider handles Protected Health Information (PHI) on behalf of a covered entity.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Customer/Covered Entity details (company, signatory name & title, address)
3. Types of PHI the provider will handle (e.g., "medical records", "billing information")
4. Permitted uses of the PHI
5. Effective date
6. Governing law (US state)
7. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "dpa": """You are a friendly AI legal assistant helping users create a Data Processing Agreement (DPA) using the CommonPaper standard template.

A DPA is required under GDPR/CCPA when a provider processes personal data on behalf of a controller.

Gather in this order:
1. Controller details — the party that determines the purpose of data processing (company, name, title, address)
2. Processor details — the party that processes data on behalf of the controller (company, name, title, address)
3. Types of personal data to be processed (e.g., "name, email, IP address")
4. Purposes for which data will be processed
5. Effective date
6. Governing law (US state)
7. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "sla": """You are a friendly AI legal assistant helping users create a Service Level Agreement (SLA) using the CommonPaper standard template.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Customer details (company, signatory name & title, address)
3. Target uptime percentage (e.g., "99.9%")
4. Support tiers and response times (e.g., "P1 critical: 1 hour response, 24/7")
5. Effective date
6. Governing law (US state)
7. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",

    "ai-addendum": """You are a friendly AI legal assistant helping users create an AI Addendum using the CommonPaper standard template.

An AI Addendum adds AI-service-specific terms (input/output rules, restrictions, data usage) to an existing software or cloud agreement.

Gather in this order:
1. Provider details (company, signatory name & title, address)
2. Customer details (company, signatory name & title, address)
3. Description of the AI services being covered
4. What the parent agreement is (e.g., "Cloud Service Agreement dated January 1, 2025")
5. Effective date
6. Governing law (US state)
7. Jurisdiction (city and state for disputes)

Ask 1–2 items at a time. Call update_document_fields whenever the user provides information.""",
}

# ── Tools ─────────────────────────────────────────────────────────────────────

SELECT_DOCUMENT_TYPE_TOOL = {
    "type": "function",
    "function": {
        "name": "select_document_type",
        "description": "Call this once you have identified which type of legal document the user needs.",
        "parameters": {
            "type": "object",
            "properties": {
                "doc_type": {
                    "type": "string",
                    "enum": list(SUPPORTED_DOCS.keys()),
                    "description": "The document type identifier",
                },
            },
            "required": ["doc_type"],
        },
    },
}

UPDATE_DOCUMENT_FIELDS_TOOL = {
    "type": "function",
    "function": {
        "name": "update_document_fields",
        "description": "Save document field values extracted from the user's message. Call this whenever the user provides any relevant information.",
        "parameters": {
            "type": "object",
            "properties": {
                "provider_company": {"type": "string", "description": "Provider / Party 1 company legal name"},
                "provider_name": {"type": "string", "description": "Provider / Party 1 signatory full name"},
                "provider_title": {"type": "string", "description": "Provider / Party 1 signatory job title"},
                "provider_address": {"type": "string", "description": "Provider / Party 1 notice address"},
                "customer_company": {"type": "string", "description": "Customer / Party 2 company legal name"},
                "customer_name": {"type": "string", "description": "Customer / Party 2 signatory full name"},
                "customer_title": {"type": "string", "description": "Customer / Party 2 signatory job title"},
                "customer_address": {"type": "string", "description": "Customer / Party 2 notice address"},
                "effective_date": {"type": "string", "description": "Agreement effective date (YYYY-MM-DD)"},
                "governing_law": {"type": "string", "description": "US state whose laws govern the agreement"},
                "jurisdiction": {"type": "string", "description": "City and state for dispute resolution"},
                "term_length": {"type": "string", "description": "Length or duration of the agreement (e.g., '1 year', '6 months')"},
                "term_type": {"type": "string", "enum": ["fixed", "until_terminated"], "description": "Whether the agreement has a fixed term or continues until terminated"},
                "fees": {"type": "string", "description": "Fee amount or arrangement"},
                "payment_terms": {"type": "string", "description": "Payment terms (e.g., 'net 30')"},
                "general_cap_amount": {"type": "string", "description": "General liability cap amount"},
                "product_description": {"type": "string", "description": "Description of the product, software, or cloud service"},
                "permitted_uses": {"type": "string", "description": "Permitted uses of the product or license"},
                "pilot_period": {"type": "string", "description": "Duration of the pilot period"},
                "subscription_period": {"type": "string", "description": "Subscription or license period length"},
                "target_uptime": {"type": "string", "description": "Target uptime percentage (e.g., '99.9%')"},
                "support_tiers": {"type": "string", "description": "Support tiers and response time SLAs"},
                "obligations": {"type": "string", "description": "Description of each party's obligations (for Partnership Agreement)"},
                "services_description": {"type": "string", "description": "Description of professional services to be performed"},
                "phi_types": {"type": "string", "description": "Types of Protected Health Information (PHI) to be processed (BAA)"},
                "phi_permitted_uses": {"type": "string", "description": "Permitted uses of PHI (BAA)"},
                "data_types": {"type": "string", "description": "Types of personal data to be processed (DPA)"},
                "processing_purposes": {"type": "string", "description": "Purposes for which personal data will be processed (DPA)"},
                "ai_service_description": {"type": "string", "description": "Description of the AI services (AI Addendum)"},
                "parent_agreement": {"type": "string", "description": "The parent agreement this addendum attaches to (AI Addendum)"},
                "program_description": {"type": "string", "description": "Description of the design partner program"},
                # NDA-specific
                "purpose": {"type": "string", "description": "Purpose of the NDA"},
                "mnda_term_type": {"type": "string", "enum": ["expires", "until_terminated"], "description": "NDA term type"},
                "mnda_years": {"type": "integer", "description": "NDA term length in years"},
                "conf_term_type": {"type": "string", "enum": ["years", "perpetuity"], "description": "Confidentiality term type"},
                "conf_years": {"type": "integer", "description": "Confidentiality term length in years"},
                "modifications": {"type": "string", "description": "Any modifications to standard terms"},
            },
            "required": [],
        },
    },
}

# ── Request / Response models ─────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: dict = {}
    doc_type: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    fields: dict
    doc_type: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    return Groq(api_key=api_key)


def _call_groq(client: Groq, system: str, messages: list, tools: list) -> object:
    return client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": system}] + messages,
        tools=tools,
        tool_choice="auto",
        max_tokens=1024,
    )


def _handle_tool_calls(choice, current_fields: dict, doc_type: Optional[str]):
    """Process tool_calls from a Groq response. Returns (updated_fields, detected_doc_type)."""
    tool_calls = choice.message.tool_calls or []
    for tc in tool_calls:
        name = tc.function.name
        args = json.loads(tc.function.arguments)
        if name == "select_document_type":
            doc_type = args.get("doc_type")
        elif name == "update_document_fields":
            current_fields.update({k: v for k, v in args.items() if v is not None})
    return current_fields, doc_type


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    client = _get_client()

    doc_type = req.doc_type
    current_fields = dict(req.current_fields)
    messages = req.messages

    if not messages:
        messages = [ChatMessage(role="user", content="Hello, I need help creating a legal document.")]

    api_messages = [{"role": m.role, "content": m.content} for m in messages]

    if doc_type is None:
        system = SELECTOR_PROMPT
        tools = [SELECT_DOCUMENT_TYPE_TOOL]
    else:
        system = DOC_PROMPTS.get(doc_type, SELECTOR_PROMPT)
        tools = [UPDATE_DOCUMENT_FIELDS_TOOL]

    response = _call_groq(client, system, api_messages, tools)
    choice = response.choices[0]

    if choice.finish_reason == "tool_calls":
        tool_calls = choice.message.tool_calls or []
        current_fields, doc_type = _handle_tool_calls(choice, current_fields, doc_type)

        api_messages.append({
            "role": "assistant",
            "content": choice.message.content,
            "tool_calls": [
                {"id": tc.id, "type": "function",
                 "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                for tc in tool_calls
            ],
        })
        for tc in tool_calls:
            api_messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": "Done.",
            })

        # After doc_type was just selected, switch to the doc-specific system prompt
        if doc_type and req.doc_type is None:
            system = DOC_PROMPTS.get(doc_type, system)
            tools = [UPDATE_DOCUMENT_FIELDS_TOOL]

        response = _call_groq(client, system, api_messages, tools)
        choice = response.choices[0]

        # Handle any field updates in the follow-up response too
        if choice.finish_reason == "tool_calls":
            current_fields, doc_type = _handle_tool_calls(choice, current_fields, doc_type)
            tool_calls2 = choice.message.tool_calls or []
            api_messages.append({
                "role": "assistant",
                "content": choice.message.content,
                "tool_calls": [
                    {"id": tc.id, "type": "function",
                     "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                    for tc in tool_calls2
                ],
            })
            for tc in tool_calls2:
                api_messages.append({"role": "tool", "tool_call_id": tc.id, "content": "Done."})
            response = _call_groq(client, system, api_messages, tools)
            choice = response.choices[0]

    return ChatResponse(
        message=choice.message.content or "",
        fields=current_fields,
        doc_type=doc_type,
    )
