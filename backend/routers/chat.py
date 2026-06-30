import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter()

SYSTEM_PROMPT = """You are a friendly AI legal assistant helping users create a Mutual Non-Disclosure Agreement (NDA) using the CommonPaper standard template.

Your job is to have a friendly, conversational dialogue to gather all necessary information. Ask about 1–2 pieces of information at a time — never dump a long list of questions at once.

Gather information in roughly this order:
1. Purpose of the NDA (what business context / project are the parties discussing?)
2. Party 1 details: company name, then signatory name & title, then notice address
3. Party 2 details: company name, then signatory name & title, then notice address
4. Effective date (when the agreement starts)
5. MNDA term — how long the agreement lasts: a fixed number of years OR until a party terminates it
6. Confidentiality term — how long confidential information must be kept secret: N years OR in perpetuity
7. Governing law (which US state's laws govern the agreement — Delaware and California are common)
8. Jurisdiction (city/county and state where disputes would be resolved in court)
9. Any special modifications or additional terms (optional — most parties use the standard template as-is)

When the user provides information, call update_nda_fields immediately to save it. You may gather multiple fields in one call if the user provides them together.

If the user seems unsure about a legal term (governing law, MNDA term, confidentiality term), briefly explain it and suggest a common default.

When all required fields are complete, congratulate the user and let them know the NDA preview on the right is ready to review and download."""

UPDATE_NDA_FIELDS_TOOL = {
    "type": "function",
    "function": {
        "name": "update_nda_fields",
        "description": "Save NDA field values extracted from the user's message. Call this whenever the user provides any information relevant to the NDA.",
        "parameters": {
            "type": "object",
            "properties": {
                "purpose": {
                    "type": "string",
                    "description": "Business purpose for sharing confidential information"
                },
                "effective_date": {
                    "type": "string",
                    "description": "Agreement effective date in YYYY-MM-DD format"
                },
                "mnda_term_type": {
                    "type": "string",
                    "enum": ["expires", "until_terminated"],
                    "description": "'expires' if the MNDA has a fixed end date, 'until_terminated' if it continues until a party terminates it"
                },
                "mnda_years": {
                    "type": "integer",
                    "description": "Number of years for the MNDA term (only relevant when mnda_term_type is 'expires')"
                },
                "conf_term_type": {
                    "type": "string",
                    "enum": ["years", "perpetuity"],
                    "description": "'years' for a fixed confidentiality period, 'perpetuity' for indefinite"
                },
                "conf_years": {
                    "type": "integer",
                    "description": "Number of years for the confidentiality obligation (only relevant when conf_term_type is 'years')"
                },
                "governing_law": {
                    "type": "string",
                    "description": "US state whose laws govern the agreement (e.g., 'Delaware', 'California')"
                },
                "jurisdiction": {
                    "type": "string",
                    "description": "City and state for dispute resolution venue (e.g., 'San Francisco, California')"
                },
                "modifications": {
                    "type": "string",
                    "description": "Any additional special terms or modifications to the standard NDA"
                },
                "party1_company": {"type": "string", "description": "Party 1 company legal name"},
                "party1_name": {"type": "string", "description": "Party 1 signatory full name"},
                "party1_title": {"type": "string", "description": "Party 1 signatory job title"},
                "party1_address": {"type": "string", "description": "Party 1 notice address (street, city, state, zip)"},
                "party2_company": {"type": "string", "description": "Party 2 company legal name"},
                "party2_name": {"type": "string", "description": "Party 2 signatory full name"},
                "party2_title": {"type": "string", "description": "Party 2 signatory job title"},
                "party2_address": {"type": "string", "description": "Party 2 notice address (street, city, state, zip)"},
            },
            "required": []
        }
    }
}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: dict = {}


class ChatResponse(BaseModel):
    message: str
    fields: dict


def _get_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    return Groq(api_key=api_key)


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    client = _get_client()

    messages = req.messages
    if not messages:
        messages = [ChatMessage(role="user", content="Hello, I need to create a Mutual NDA.")]

    api_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    api_messages += [{"role": m.role, "content": m.content} for m in messages]

    current_fields = dict(req.current_fields)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=api_messages,
        tools=[UPDATE_NDA_FIELDS_TOOL],
        tool_choice="auto",
        max_tokens=1024,
    )

    choice = response.choices[0]

    if choice.finish_reason == "tool_calls":
        tool_calls = choice.message.tool_calls or []

        for tc in tool_calls:
            if tc.function.name == "update_nda_fields":
                current_fields.update(json.loads(tc.function.arguments))

        api_messages.append({
            "role": "assistant",
            "content": choice.message.content,
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in tool_calls
            ],
        })

        for tc in tool_calls:
            api_messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": "Fields updated successfully.",
            })

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=api_messages,
            tools=[UPDATE_NDA_FIELDS_TOOL],
            tool_choice="auto",
            max_tokens=1024,
        )

        choice = response.choices[0]

    return ChatResponse(message=choice.message.content or "", fields=current_fields)
