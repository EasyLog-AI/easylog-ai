"""ACE (Agentic Context Engineering) - Centralized LLM Prompts

This module contains all LLM prompts used by ACE v1.0 and v2.0 for:
- Reflection (analyzing tool execution)
- Curation (deciding playbook updates)
- Quality Evaluation (detecting conversational issues)

Benefits of centralization:
- Version control for prompts
- Easier testing and iteration
- Reduced code duplication
- Clear separation of concerns
"""

import json
from typing import Any


class ACEPrompts:
    """Centralized ACE prompts for version control and testing."""

    # ========================================================================
    # ACE v1.0 - Reflector Prompts
    # ========================================================================

    @staticmethod
    def reflection_system_prompt() -> str:
        """System prompt for LLM-based reflection.
        
        Returns:
            System prompt defining the reflector's role and behavior
        """
        return (
            "You are an expert at analyzing agent execution and creating actionable strategies. "
            "Be concise and specific."
        )

    @staticmethod
    def reflection_user_prompt(
        tool_name: str,
        tool_args: dict[str, Any],
        error_context: str,
        playbook_bullets: str,
        max_bullet_length: int,
    ) -> str:
        """Build reflection user prompt with execution context.
        
        Args:
            tool_name: Name of the tool that was executed
            tool_args: Arguments passed to the tool
            error_context: "ERROR: <message>" if failed, "SUCCESS" if succeeded
            playbook_bullets: Formatted list of current playbook bullets
            max_bullet_length: Maximum characters allowed for insights
            
        Returns:
            Formatted reflection prompt for LLM
        """
        return f"""Analyze this agent tool execution and evaluate the playbook bullets.

## EXECUTION DETAILS:
Tool: {tool_name}
Arguments: {json.dumps(tool_args, indent=2)}
Result: {error_context}

## AVAILABLE PLAYBOOK BULLETS:
{playbook_bullets if playbook_bullets else "(No bullets yet - this is the first execution)"}

## YOUR ANALYSIS TASK:
1. **Bullet Tagging**: Which bullets (by ID) were helpful or harmful?
   - HELPFUL: Bullet advice was followed and helped prevent errors
   - HARMFUL: Bullet advice led to or didn't prevent this error
   - Only tag bullets that are directly relevant to this execution

2. **Error Analysis** (if error occurred):
   - What went wrong?
   - Why did it happen?
   
3. **Key Insight**: Generate ONE actionable strategy (max {max_bullet_length} chars) to add to playbook
   - Must be specific and prevent future errors
   - Must be concise and clear
   - If this error type is new, explain how to prevent it

## RESPONSE FORMAT (JSON):
{{
  "helpful_bullets": ["mumc-001", "mumc-003"],  // Only IDs that actually helped
  "harmful_bullets": ["mumc-002"],              // Only IDs that were harmful
  "error_identification": "Specific error description",
  "root_cause": "Why this happened",
  "key_insight": "Actionable strategy under {max_bullet_length} chars"
}}

IMPORTANT:
- Only reference bullet IDs that exist in the playbook above
- Be conservative with tagging - only tag clearly relevant bullets
- Key insight must be under {max_bullet_length} characters
- Focus on actionable, specific strategies"""

    # ========================================================================
    # ACE v1.0 - Curator Prompts
    # ========================================================================

    @staticmethod
    def curation_system_prompt() -> str:
        """System prompt for LLM-based curation.
        
        Returns:
            System prompt defining the curator's role and behavior
        """
        return (
            "You are an expert at curating knowledge bases. "
            "Be conservative and maintain high quality standards."
        )

    @staticmethod
    def curation_user_prompt(
        key_insight: str,
        tool_name: str,
        playbook_bullets: str,
        sections_desc: str,
        max_bullet_length: int,
        num_bullets: int,
    ) -> str:
        """Build curation user prompt with playbook context.
        
        Args:
            key_insight: New insight from reflection to potentially add
            tool_name: Name of the tool that generated this insight
            playbook_bullets: Formatted list of current playbook bullets
            sections_desc: Description of available playbook sections
            max_bullet_length: Maximum characters allowed for bullets
            num_bullets: Current number of bullets in playbook
            
        Returns:
            Formatted curation prompt for LLM
        """
        return f"""Decide how to update the playbook based on this new insight.

## NEW INSIGHT FROM REFLECTION:
"{key_insight}"

Context: Tool '{tool_name}' execution analysis

## CURRENT PLAYBOOK ({num_bullets} bullets):
{playbook_bullets if playbook_bullets else "(Empty playbook)"}

## AVAILABLE SECTIONS:
{sections_desc}

## CURATION DECISION:
Analyze if this insight should be added to the playbook. Consider:

1. **Duplicate Check**: Is this insight already captured (similar meaning)?
2. **Value Assessment**: Does this add unique, actionable value?
3. **Section Assignment**: Which section fits best?
4. **Merge Opportunity**: Should it replace or merge with existing bullet?

## RESPONSE FORMAT (JSON):
{{
  "action": "ADD" | "SKIP" | "MERGE",
  "reasoning": "Brief explanation of decision",
  "section": "section_name",  // if ADD or MERGE
  "content": "Final bullet content (max {max_bullet_length} chars)",  // if ADD
  "merge_with_id": "mumc-001"  // if MERGE - which bullet to replace
}}

IMPORTANT:
- SKIP if duplicate or low value
- ADD if genuinely new and useful
- MERGE if it improves an existing bullet
- Keep content under {max_bullet_length} characters
- Be conservative - quality over quantity"""

    # ========================================================================
    # ACE v2.0 - Quality Evaluator Prompts
    # ========================================================================

    @staticmethod
    def quality_evaluation_system_prompt(
        focus_categories: list[str],
        critical_health_signals: list[str],
        factual_verification_rules: list[str],
        max_bullet_length: int,
    ) -> str:
        """System prompt for quality evaluation.
        
        Args:
            focus_categories: Quality categories to prioritize
            critical_health_signals: Health signals that must never be missed
            factual_verification_rules: Rules for verifying factual accuracy
            max_bullet_length: Maximum characters for suggestions
            
        Returns:
            Formatted system prompt for quality evaluator
        """
        focus_str = ", ".join(focus_categories)
        health_signals = "\n".join(f"- {signal}" for signal in critical_health_signals)
        verification_rules = "\n".join(f"- {rule}" for rule in factual_verification_rules)
        
        return f"""You are a healthcare conversation quality evaluator for a COPD coach AI.

**Your Task:** Analyze the assistant's response and detect quality issues.

**Focus Categories (Priority):** {focus_str}

**Critical Health Signals to NEVER Miss:**
{health_signals}

**Factual Verification Rules:**
{verification_rules}

**Response Format (JSON):**
{{
    "overall_quality": "excellent|good|acceptable|poor",
    "issues": [
        {{
            "category": "missed_critical_signal|factual_error|context_violation|communication_breakdown|inappropriate_response",
            "severity": "LOW|MEDIUM|HIGH|CRITICAL",
            "description": "What went wrong (be specific)",
            "suggestion": "How to fix it (max {max_bullet_length} chars, actionable)",
            "relevant_context": {{"key": "value"}}
        }}
    ],
    "positive_aspects": ["What was done well"],
    "analysis_reasoning": "Your reasoning for this evaluation"
}}

**Evaluation Guidelines:**
- Be STRICT on health signals (any missed critical signal is CRITICAL severity)
- Be STRICT on factual errors (fabricated data is HIGH/CRITICAL)
- Be LENIENT on minor communication style issues
- Focus on patient safety and data accuracy above all else"""

    @staticmethod
    def quality_evaluation_user_prompt(
        user_message: str,
        assistant_response: str,
        history_str: str,
        context_str: str,
        focus_str: str,
    ) -> str:
        """Build quality evaluation user prompt.
        
        Args:
            user_message: Latest user message
            assistant_response: Assistant's response to evaluate
            history_str: Formatted conversation history
            context_str: Formatted available context
            focus_str: Comma-separated focus categories
            
        Returns:
            Formatted evaluation prompt for LLM
        """
        return f"""**Conversation History (Last 5 messages):**
{history_str}

**Latest Exchange:**
User: {user_message}
Assistant: {assistant_response}

**Available Context:**
{context_str}

**Your Task:**
Evaluate the assistant's response for quality issues.
Focus especially on: {focus_str}

Respond in JSON format as specified in the system prompt."""

