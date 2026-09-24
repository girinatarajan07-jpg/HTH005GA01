"""
Risk-Severity Scoring Service.
Calculates 0-100 quantitative risk scores and categorizes into CRITICAL, HIGH, MEDIUM, LOW, or NOT_ASSESSED.
Provides a one-line rationale for each risk assessment (PRD F10).
"""

import re
from typing import Tuple
from app.models.schemas import Classification, RiskLevel

# High risk legal terms and policy divergence keywords
CRITICAL_KEYWORDS = [
    r"breach", r"incident\s+notif", r"indemnif", r"liability", r"audit", r"inspection"
]

HIGH_IMPACT_KEYWORDS = [
    r"gdpr", r"cross-border", r"encryption", r"retention", r"deletion", r"subprocessor", r"payment"
]


def calculate_risk_score(
    classification: Classification,
    clause_text: str,
    explanation: str
) -> Tuple[float, RiskLevel, str]:
    """
    Computes a risk score (0.0 - 100.0), assigns a RiskLevel (CRITICAL, HIGH, MEDIUM, LOW),
    and produces a concise one-line rationale.
    """
    clause_lower = clause_text.lower()
    exp_lower = explanation.lower()

    is_critical_domain = any(re.search(kw, clause_lower) or re.search(kw, exp_lower) for kw in CRITICAL_KEYWORDS)
    is_high_impact = any(re.search(kw, clause_lower) or re.search(kw, exp_lower) for kw in HIGH_IMPACT_KEYWORDS)

    if classification == Classification.EXPLICIT_CONFLICT:
        if is_critical_domain:
            score = 96.0
            rationale = "Critical governance violation exposing organization to uncapped liability, unmonitored breaches, or audit denial."
            return score, RiskLevel.CRITICAL, rationale
        elif is_high_impact:
            score = 85.0
            rationale = "Direct conflict with corporate governance standards requiring executive renegotiation."
            return score, RiskLevel.HIGH, rationale
        score = 75.0
        rationale = "Explicit divergence from standard procurement and contractual policies."
        return score, RiskLevel.HIGH, rationale

    elif classification == Classification.INFERRED:
        if is_critical_domain or is_high_impact:
            score = 65.0
            rationale = "Ambiguous terms or missing baseline protections that create potential legal exposure."
            return score, RiskLevel.HIGH, rationale
        score = 48.0
        rationale = "Vague standard of care or implicit variance requiring counsel clarification."
        return score, RiskLevel.MEDIUM, rationale

    elif classification == Classification.NOT_FOUND:
        if is_critical_domain:
            score = 35.0
            rationale = "Policy is silent on high-sensitivity domain; manual legal risk appraisal required."
            return score, RiskLevel.MEDIUM, rationale
        score = 15.0
        rationale = "Internal corporate policy is silent; standard commercial risk profile applies."
        return score, RiskLevel.LOW, rationale

    elif classification == Classification.NO_CONFLICT:
        score = 5.0
        rationale = "Fully compliant with corporate governance baselines and security requirements."
        return score, RiskLevel.LOW, rationale

    return 0.0, RiskLevel.NOT_ASSESSED, "Risk level unassessed."
