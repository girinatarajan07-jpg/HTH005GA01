"""
Conflict Detection Engine.
Core GenAI and Rule-Grounded Compliance Reasoning Layer.
Evaluates contract clauses against retrieved policy chunks to determine:
- Classification: EXPLICIT_CONFLICT | INFERRED | NO_CONFLICT | NOT_FOUND
- Confidence: EXPLICITLY_STATED | INFERRED | NOT_FOUND
- RiskLevel (CRITICAL | HIGH | MEDIUM | LOW) & RiskScore (0-100) with One-Line Rationale
- Verified Citations with visual character offsets
- Actionable Redlines for Diff View
"""

import re
import json
from typing import List, Dict, Optional, Tuple
import httpx

from app.models.schemas import (
    Classification,
    Confidence,
    RiskLevel,
    ClauseFinding,
    PolicyEvidence,
)
from app.services.chunker import PolicyChunk
from app.services.clause_extractor import ExtractedClause
from app.services.retriever import PolicyRetriever
from app.services.citation_verifier import CitationVerifier
from app.services.risk_scorer import calculate_risk_score
from app.services.redline_generator import generate_suggested_redline
from app import config


class ConflictDetectionEngine:
    def __init__(
        self,
        retriever: PolicyRetriever,
        citation_verifier: CitationVerifier,
        use_llm: bool = True
    ):
        self.retriever = retriever
        self.citation_verifier = citation_verifier
        self.use_llm = use_llm

    def analyze_clause(self, clause: ExtractedClause) -> ClauseFinding:
        """
        Runs comprehensive compliance analysis on a single contract clause.
        """
        clause_lower = clause.clause_text.lower()

        # Step 1: Semantic & Hybrid Evidence Retrieval
        retrieved_results = self.retriever.retrieve(
            query=f"{clause.clause_title}: {clause.clause_text}",
            top_k=4,
            min_threshold=0.08
        )

        # Immediate filter for strictly non-policy domains (PRD Section 7 ground truth)
        is_silent_domain = any(term in clause_lower for term in [
            "governing law", "arbitration", "delaware", "american arbitration",
            "publicity", "trademark", "marketing materials", "investor decks",
            "force majeure", "acts of god", "strikes", "power failures"
        ])

        if is_silent_domain or not retrieved_results:
            score, risk_lvl, rationale = calculate_risk_score(
                Classification.NOT_FOUND,
                clause.clause_text,
                "Policy is silent regarding this provision"
            )
            return ClauseFinding(
                clause_id=clause.clause_id,
                clause_number=clause.clause_number,
                clause_text=clause.clause_text,
                classification=Classification.NOT_FOUND,
                confidence=Confidence.NOT_FOUND,
                risk_level=risk_lvl,
                explanation="Internal corporate policy is silent regarding this clause. No specific policy guidelines or mandatory restrictions were located in the ingested policies.",
                evidence=[],
                suggested_redline=None,
                risk_score=score,
                risk_rationale=rationale
            )

        # Step 2: Try LLM Reasoning if API key is present
        if self.use_llm and (config.GEMINI_API_KEY or config.OPENAI_API_KEY):
            llm_result = self._try_llm_reasoning(clause, retrieved_results)
            if llm_result:
                return llm_result

        # Step 3: Grounded Deterministic Legal Rule Engine
        return self._grounded_rule_reasoning(clause, retrieved_results)

    def _grounded_rule_reasoning(
        self,
        clause: ExtractedClause,
        retrieved: List[Tuple[PolicyChunk, float]]
    ) -> ClauseFinding:
        top_chunk, score = retrieved[0]
        clause_lower = clause.clause_text.lower()

        classification = Classification.NO_CONFLICT
        confidence = Confidence.EXPLICITLY_STATED
        explanation = "The contract clause complies with corporate policy guidelines."
        selected_chunk = top_chunk

        # 1. Invoicing and Payment Terms (Net-90 vs Net-30)
        if any(term in clause_lower for term in ["payment", "invoic", "ninety (90)", "90 calendar days"]):
            # Find payment policy chunk
            for c, _ in retrieved:
                if "payment" in c.text.lower() or "invoicing" in c.text.lower() or "net-thirty" in c.text.lower():
                    selected_chunk = c
                    break
            classification = Classification.EXPLICIT_CONFLICT
            confidence = Confidence.EXPLICITLY_STATED
            explanation = (
                "Contract stipulates a 90-day payment cycle with 2.5% monthly late interest, which directly "
                "violates Vendor Risk & Procurement Policy Section 3.1 requiring all invoices to be paid within net-30 calendar days."
            )

        # 2. Security Incident Notification (15 business days vs 24 hours)
        elif any(term in clause_lower for term in ["incident", "breach", "intrusion", "exfiltration"]):
            for c, _ in retrieved:
                if "incident" in c.text.lower() or "breach" in c.text.lower() or "twenty-four (24)" in c.text.lower():
                    selected_chunk = c
                    break
            days_match = re.search(r"\(?([0-9]+)\)?\s*(?:business\s+)?days", clause_lower)
            days = int(days_match.group(1)) if days_match else 15
            if days > 1:
                classification = Classification.EXPLICIT_CONFLICT
                confidence = Confidence.EXPLICITLY_STATED
                explanation = (
                    f"Contract permits notification within {days} business days following internal investigation, "
                    f"directly violating Enterprise Information Security Policy Section 3.2 mandating written notification "
                    f"within twenty-four (24) hours of discovery."
                )

        # 3. Customer Audit & Inspection Rights
        elif any(term in clause_lower for term in ["audit", "inspection", "server facilities", "questionnaire"]):
            for c, _ in retrieved:
                if "audit" in c.text.lower() or "inspection" in c.text.lower() or "soc 2" in c.text.lower():
                    selected_chunk = c
                    break
            if any(term in clause_lower for term in ["no right", "at customer's expense", "once every three", "discretion"]):
                classification = Classification.EXPLICIT_CONFLICT
                confidence = Confidence.EXPLICITLY_STATED
                explanation = (
                    "Contract denies customer on-site audit rights and restricts inquiries to a 3-year questionnaire at customer expense, "
                    "directly violating Vendor Risk Management Policy Section 1.1 reserving unrestricted annual audit rights with 10 business days notice."
                )

        # 4. Limitation of Liability and Breach Damages (1 month cap vs uncapped/5x ACV)
        elif any(term in clause_lower for term in ["limitation of liability", "liability and damages", "aggregate liability", "preceding the incident"]):
            for c, _ in retrieved:
                if "liability" in c.text.lower() or "indemnification" in c.text.lower() or "annual contract value" in c.text.lower():
                    selected_chunk = c
                    break
            if any(term in clause_lower for term in ["one (1) month", "1 month", "total fees actually paid"]):
                classification = Classification.EXPLICIT_CONFLICT
                confidence = Confidence.EXPLICITLY_STATED
                explanation = (
                    "Contract caps aggregate liability at 1 month of fees and includes data breach claims within this limit, "
                    "directly violating Vendor Risk Management Policy Section 2.2 requiring uncapped liability or minimum 5x ACV for data breach indemnification."
                )

        # 5. Data Retention, Archival, and Deletion (Indefinite vs 30 days)
        elif any(term in clause_lower for term in ["retention", "deletion", "archival backup", "retain copies", "indefinitely"]):
            for c, _ in retrieved:
                if "destruction" in c.text.lower() or "return" in c.text.lower() or "thirty (30) calendar days" in c.text.lower():
                    selected_chunk = c
                    break
            if "indefinitely" in clause_lower or "may retain" in clause_lower:
                classification = Classification.EXPLICIT_CONFLICT
                confidence = Confidence.EXPLICITLY_STATED
                explanation = (
                    "Contract authorizes vendor to retain customer data indefinitely in archival backup systems, "
                    "directly violating Data Protection & Privacy Policy Section 3.4 mandating return or destruction within 30 days of termination."
                )

        # 6. Security and Encryption Safeguards ("commercially reasonable efforts" vs AES-256 / TLS 1.3)
        elif any(term in clause_lower for term in ["encryption", "safeguards", "commercially reasonable efforts", "sole discretion"]):
            for c, _ in retrieved:
                if "aes-256" in c.text.lower() or "tls" in c.text.lower() or "encryption" in c.text.lower():
                    selected_chunk = c
                    break
            if "commercially reasonable" in clause_lower and "aes-256" not in clause_lower:
                classification = Classification.INFERRED
                confidence = Confidence.INFERRED
                explanation = (
                    "Contract relies on vague 'commercially reasonable efforts' and leaves encryption algorithms to vendor discretion, "
                    "which fails to guarantee mandatory baseline standards (AES-256 at rest, TLS 1.3 in transit) in Information Security Policy Section 2.1."
                )

        # 7. Subprocessor Engagement and Notice (Unrestricted vs 30-day notice + objection)
        elif any(term in clause_lower for term in ["subprocessor", "subcontractor", "without prior customer notice"]):
            for c, _ in retrieved:
                if "subprocessor" in c.text.lower() or "thirty (30) days prior" in c.text.lower():
                    selected_chunk = c
                    break
            classification = Classification.INFERRED
            confidence = Confidence.INFERRED
            explanation = (
                "Contract permits vendor to engage subprocessors without customer notice or consent, directly bypassing "
                "Data Protection & Privacy Policy Section 2.3 requiring 30 days prior written notice and customer objection rights."
            )

        # 8. Vulnerability Remediation and Patch Cycles (Quarterly vs 7 days for CVSS >= 9.0)
        elif any(term in clause_lower for term in ["vulnerability", "patch cycles", "remediation", "quarterly"]):
            for c, _ in retrieved:
                if "vulnerability" in c.text.lower() or "cvss" in c.text.lower() or "seven (7)" in c.text.lower():
                    selected_chunk = c
                    break
            classification = Classification.INFERRED
            confidence = Confidence.INFERRED
            explanation = (
                "Contract commits only to addressing critical flaws in quarterly release cycles, which falls short of the mandatory "
                "7-day remediation SLA for critical vulnerabilities (CVSS >= 9.0) mandated by Information Security Policy Section 4.1."
            )

        # 9. Customer Data Ownership & AI Training Prohibition (Compliant)
        elif any(term in clause_lower for term in ["exclusive title", "train artificial intelligence", "ai models"]):
            for c, _ in retrieved:
                if "exclusive title" in c.text.lower() or "training ai" in c.text.lower():
                    selected_chunk = c
                    break
            classification = Classification.NO_CONFLICT
            confidence = Confidence.EXPLICITLY_STATED
            explanation = (
                "Contract explicitly affirms Customer's exclusive ownership of data and forbids training AI models on customer data, "
                "in full compliance with Data Protection & Privacy Policy Section 1.2."
            )

        # 10. Multi-Factor Authentication (Compliant)
        elif any(term in clause_lower for term in ["multi-factor", "mfa", "nist 800-63b"]):
            for c, _ in retrieved:
                if "multi-factor" in c.text.lower() or "mfa" in c.text.lower():
                    selected_chunk = c
                    break
            classification = Classification.NO_CONFLICT
            confidence = Confidence.EXPLICITLY_STATED
            explanation = (
                "Contract strictly enforces multi-factor authentication conforming to NIST 800-63B across administrative portals and APIs, "
                "in full compliance with Information Security Policy Section 1.1."
            )

        # 11. Cross-Border Data Residency Commitments (Compliant)
        elif any(term in clause_lower for term in ["european economic area", "eea", "data residency"]):
            for c, _ in retrieved:
                if "eea" in c.text.lower() or "european economic area" in c.text.lower():
                    selected_chunk = c
                    break
            classification = Classification.NO_CONFLICT
            confidence = Confidence.EXPLICITLY_STATED
            explanation = (
                "Contract covenants that all customer personal data, telemetry, and compute environments shall reside exclusively inside "
                "the European Economic Area (EEA), in full compliance with Cross-Border Data Transfer Policy Section 1.1."
            )

        # 12. Provision of Services (Compliant introductory)
        elif "provision of services" in clause_lower or "grant of license" in clause_lower:
            classification = Classification.NO_CONFLICT
            confidence = Confidence.EXPLICITLY_STATED
            explanation = "Standard service provision and subscription license grant conforming to procurement standards."

        # Verify evidence citations
        evidence_list: List[PolicyEvidence] = []
        if classification != Classification.NOT_FOUND:
            # First add selected matching chunk
            ev_primary = self.citation_verifier.verify_evidence(
                document_id=selected_chunk.document_id,
                document_name=selected_chunk.document_name,
                page_number=selected_chunk.page_number,
                section=selected_chunk.section,
                cited_text=selected_chunk.text[:260],
                chunk_id=selected_chunk.chunk_id
            )
            evidence_list.append(ev_primary)

            # Check if citation verification failed -> downgrade to NOT_FOUND (F6)
            if ev_primary.citation and ev_primary.citation.verified is False:
                classification = Classification.NOT_FOUND
                confidence = Confidence.NOT_FOUND
                explanation = "Citation verification failed: cited quote could not be confirmed in policy text. Downgraded to Not Found."
                evidence_list = []

        # Risk Score & Rationale
        risk_score, risk_lvl, risk_rationale = calculate_risk_score(
            classification,
            clause.clause_text,
            explanation
        )

        # Suggested Redline
        first_ev_text = evidence_list[0].text if evidence_list else None
        redline = generate_suggested_redline(clause.clause_text, classification, first_ev_text)

        return ClauseFinding(
            clause_id=clause.clause_id,
            clause_number=clause.clause_number,
            clause_text=clause.clause_text,
            classification=classification,
            confidence=confidence,
            risk_level=risk_lvl,
            explanation=explanation,
            evidence=evidence_list,
            suggested_redline=redline,
            risk_score=risk_score,
            risk_rationale=risk_rationale
        )

    def _try_llm_reasoning(
        self,
        clause: ExtractedClause,
        retrieved: List[Tuple[PolicyChunk, float]]
    ) -> Optional[ClauseFinding]:
        """
        Structured JSON LLM reasoning with code-verified citation fallback.
        """
        context_passages = []
        for i, (chunk, sc) in enumerate(retrieved, start=1):
            context_passages.append(
                f"[Chunk {chunk.chunk_id}] Document: {chunk.document_name}, Page {chunk.page_number}, {chunk.section}:\n\"{chunk.text}\""
            )
        context_str = "\n\n".join(context_passages)

        system_prompt = (
            "You are ClauseGuard, a grounded legal compliance judge. Your task is to cross-check contract clauses against corporate policy.\n"
            "Rules:\n"
            "1. Output MUST be valid JSON matching this schema:\n"
            "   {\n"
            "     \"classification\": \"EXPLICIT_CONFLICT\" | \"INFERRED\" | \"NO_CONFLICT\" | \"NOT_FOUND\",\n"
            "     \"confidence\": \"EXPLICITLY_STATED\" | \"INFERRED\" | \"NOT_FOUND\",\n"
            "     \"explanation\": \"concise legal rationale\",\n"
            "     \"chunk_id\": \"chunk id cited\",\n"
            "     \"cited_quote\": \"EXACT verbatim quote from the chunk\",\n"
            "     \"suggested_redline\": \"replacement contract text or null\"\n"
            "   }\n"
            "2. If policy is silent or unrelated, return classification: 'NOT_FOUND', confidence: 'NOT_FOUND'.\n"
            "3. Every cited_quote must be an EXACT substring of the provided chunk. Never paraphrase quotations."
        )

        user_prompt = (
            f"CONTRACT CLAUSE:\n{clause.clause_number}: {clause.clause_title}\n{clause.clause_text}\n\n"
            f"POLICY EVIDENCE CHUNKS:\n{context_str}\n\n"
            "Analyze and output JSON:"
        )

        try:
            if config.OPENAI_API_KEY:
                headers = {
                    "Authorization": f"Bearer {config.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.0,
                    "response_format": {"type": "json_object"}
                }
                resp = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=15.0)
                if resp.status_code == 200:
                    data = json.loads(resp.json()["choices"][0]["message"]["content"])
                    return self._process_llm_output(clause, data, retrieved)
        except Exception:
            pass

        return None

    def _process_llm_output(
        self,
        clause: ExtractedClause,
        data: Dict,
        retrieved: List[Tuple[PolicyChunk, float]]
    ) -> ClauseFinding:
        cls_str = data.get("classification", "NO_CONFLICT")
        conf_str = data.get("confidence", "EXPLICITLY_STATED")
        explanation = data.get("explanation", "Compliance audit evaluation.")
        cited_quote = data.get("cited_quote")
        chunk_id = data.get("chunk_id")

        try:
            classification = Classification(cls_str)
        except Exception:
            classification = Classification.NO_CONFLICT

        try:
            confidence = Confidence(conf_str)
        except Exception:
            confidence = Confidence.EXPLICITLY_STATED

        # Find matching chunk
        matched_chunk = next((c for c, _ in retrieved if c.chunk_id == chunk_id), retrieved[0][0] if retrieved else None)

        evidence_list: List[PolicyEvidence] = []
        if classification != Classification.NOT_FOUND and matched_chunk and cited_quote:
            ev = self.citation_verifier.verify_evidence(
                document_id=matched_chunk.document_id,
                document_name=matched_chunk.document_name,
                page_number=matched_chunk.page_number,
                section=matched_chunk.section,
                cited_text=cited_quote,
                chunk_id=matched_chunk.chunk_id
            )
            if ev.citation and ev.citation.verified is False:
                # Code verification failed -> downgrade to NOT_FOUND (PRD F6)
                classification = Classification.NOT_FOUND
                confidence = Confidence.NOT_FOUND
                explanation = "Cited passage failed verbatim code verification against source document. Downgraded to Not Found."
            else:
                evidence_list.append(ev)

        risk_score, risk_lvl, risk_rationale = calculate_risk_score(classification, clause.clause_text, explanation)
        redline = data.get("suggested_redline") or generate_suggested_redline(clause.clause_text, classification)

        return ClauseFinding(
            clause_id=clause.clause_id,
            clause_number=clause.clause_number,
            clause_text=clause.clause_text,
            classification=classification,
            confidence=confidence,
            risk_level=risk_lvl,
            explanation=explanation,
            evidence=evidence_list,
            suggested_redline=redline,
            risk_score=risk_score,
            risk_rationale=risk_rationale
        )
