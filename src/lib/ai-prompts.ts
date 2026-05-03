// ─────────────────────────────────────────────────────────────────────────────
// Structured AI prompts for each BugFlow feature
// Each function returns a user-facing OllamaMessage[] ready to send
// ─────────────────────────────────────────────────────────────────────────────

import type { OllamaMessage } from './ollama';

// ── 1. Scope Summary ──────────────────────────────────────────────────────────
export function buildScopeSummaryPrompt(program: {
  name: string;
  rawProgramText: string;
  inScope: string;
  outOfScope: string;
  allowedTesting: string;
  forbiddenTesting: string;
  rateLimits: string;
  rewardInfo: string;
}): OllamaMessage[] {
  return [
    {
      role: 'user',
      content: `Analyze this bug bounty program and produce a clear scope summary.

Program Name: ${program.name}

Raw Program Text:
${program.rawProgramText || '(not provided)'}

In-Scope Assets:
${program.inScope || '(not provided)'}

Out-of-Scope Assets:
${program.outOfScope || '(not provided)'}

Allowed Testing:
${program.allowedTesting || '(not provided)'}

Forbidden Testing:
${program.forbiddenTesting || '(not provided)'}

Rate Limits:
${program.rateLimits || '(not provided)'}

Reward Information:
${program.rewardInfo || '(not provided)'}

Return a JSON object with exactly these fields:
{
  "scopeSummary": "Plain English 3-5 sentence summary of what this program is about and what is in scope",
  "allowedAssets": ["list of clearly in-scope assets or domains"],
  "forbiddenAssets": ["list of out-of-scope assets or actions"],
  "safetyWarnings": ["list of specific things the tester MUST NOT do"],
  "clarifyingQuestions": ["list of questions to clarify before testing"],
  "safetySummary": "One paragraph safety briefing for this program"
}

Return valid JSON only. No markdown fences. No extra text.`,
    },
  ];
}

// ── 2. Single-Phase Roadmap Generation ────────────────────────────────────────
// Generates detailed content for ONE phase at a time, with context from prior work
export function buildSinglePhasePrompt(opts: {
  programName: string;
  inScope: string;
  outOfScope: string;
  allowedTesting: string;
  forbiddenTesting: string;
  rawProgramText: string;
  phaseNumber: number;
  phaseTitle: string;
  completedPhaseSummaries: string;
  recentFindings: string;
  recentReconNotes: string;
}): OllamaMessage[] {
  return [
    {
      role: 'user',
      content: `Generate a detailed, safe, authorized-testing roadmap for **one specific phase** of a bug bounty program.

Program: ${opts.programName}

In-Scope Assets:
${opts.inScope || '(not provided)'}

Out-of-Scope Assets:
${opts.outOfScope || '(not provided)'}

Allowed Testing:
${opts.allowedTesting || '(not provided)'}

Forbidden Testing:
${opts.forbiddenTesting || '(not provided)'}

Additional Program Context:
${opts.rawProgramText ? opts.rawProgramText.slice(0, 1500) : '(not provided)'}

---

Phase to Generate: Phase ${opts.phaseNumber} — ${opts.phaseTitle}

${opts.completedPhaseSummaries ? `Previously Completed Phases:\n${opts.completedPhaseSummaries}` : 'This is the first phase — no previous phases completed.'}

${opts.recentFindings ? `Findings So Far:\n${opts.recentFindings}` : 'No findings recorded yet.'}

${opts.recentReconNotes ? `Recent Recon Notes:\n${opts.recentReconNotes}` : 'No recon notes recorded yet.'}

---

Generate detailed content for Phase ${opts.phaseNumber} (${opts.phaseTitle}) ONLY.

Return a JSON object with this exact structure:
{
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "goal": "one sentence goal for this phase",
  "whyItMatters": "why this phase is important, referencing program context",
  "manualApproach": "step-by-step manual approach for this phase",
  "recommendedTools": "specific tools to use (user runs them externally)",
  "inputsToCollect": "what data to bring into this phase",
  "whatToLookFor": "specific indicators, anomalies, or patterns",
  "possibleBugClasses": "vulnerability types relevant to this phase",
  "safeValidationSteps": "safe ways to confirm issues found",
  "notesToSave": "what to document during this phase",
  "completionCriteria": "how to know this phase is complete",
  "safetyWarnings": "what to avoid in this phase",
  "aiQuestions": "questions to ask AI when stuck in this phase",
  "tasks": [
    {
      "title": "task title",
      "description": "detailed description of what to do",
      "stepByStepGuide": ["Detailed Step 1...", "Detailed Step 2..."],
      "commands": ["Specific command line examples or tool configurations"],
      "suggestedTools": "tools to use manually",
      "expectedOutput": "what you should find or produce",
      "possibleBugClasses": "relevant vulnerability types",
      "safetyNotes": "what to avoid",
      "completionCriteria": "done when..."
    }
  ]
}

Rules:
- Generate 3-6 specific, actionable tasks for this phase
- If previous phases found interesting results, tailor recommendations to those findings
- Stay within authorized bug bounty testing only
- Do not suggest out-of-scope testing
- Do not suggest DoS, brute force, credential stuffing, phishing, malware, persistence, evasion, or destructive testing
- Recommend passive approaches before active testing
- Recommend manual validation
- Recommend using only user-owned test accounts and test data
- Make the content beginner-friendly but detailed

Return valid JSON only. No markdown fences. No extra text.`,
    },
  ];
}

// Phase titles used when initializing the roadmap shell
export const ROADMAP_PHASE_TITLES = [
  'Scope Review',
  'Target Prioritization',
  'Passive Recon',
  'Live Asset Validation',
  'Technology Fingerprinting',
  'Application Mapping',
  'Authentication Testing',
  'Authorization Testing',
  'API Testing',
  'Input Validation Testing',
  'File Upload and File Access Testing',
  'Business Logic Testing',
  'Session Management Testing',
  'Misconfiguration Review',
  'Vulnerability Validation',
  'Evidence Collection',
  'Report Writing',
  'Post-Submission Tracking',
] as const;

// ── 3. Recon Output Analysis ──────────────────────────────────────────────────
export function buildReconAnalysisPrompt(
  toolName: string,
  rawOutput: string,
  programScope: { inScope: string; outOfScope: string; name: string }
): OllamaMessage[] {
  return [
    {
      role: 'user',
      content: `The user pasted recon output from an authorized bug bounty program. Analyze it safely.

Program: ${programScope.name}
In-Scope: ${programScope.inScope || '(not provided)'}
Out-of-Scope: ${programScope.outOfScope || '(not provided)'}

Tool/Source: ${toolName}

Raw Output:
${rawOutput.slice(0, 4000)}

Return a JSON object with exactly these fields:
{
  "summary": "2-3 sentence plain English summary of what was found",
  "interestingAssets": ["list of hosts/domains/IPs worth investigating"],
  "interestingEndpoints": ["list of paths/endpoints worth investigating"],
  "technologies": ["detected technologies, frameworks, or patterns"],
  "suggestedNextSteps": ["safe manual steps the tester should take next"],
  "whatToAvoid": ["items that appear out-of-scope or risky to test"]
}

Rules:
- Do not suggest aggressive testing
- Do not suggest out-of-scope testing
- Do not generate harmful exploit payloads
- Flag anything that looks outside the program scope

Return valid JSON only. No markdown fences. No extra text.`,
    },
  ];
}

// ── 4. Finding Validation ─────────────────────────────────────────────────────
export function buildFindingValidationPrompt(
  finding: {
    title: string;
    vulnerabilityType: string;
    endpoint: string;
    severity: string;
    description: string;
    stepsTested: string;
    evidenceSummary: string;
    impact: string;
  },
  programScope: { inScope: string; outOfScope: string; name: string; forbiddenTesting: string }
): OllamaMessage[] {
  return [
    {
      role: 'user',
      content: `The user is evaluating a possible bug bounty finding. Analyze it safely.

Program: ${programScope.name}
In-Scope: ${programScope.inScope || '(not provided)'}
Out-of-Scope: ${programScope.outOfScope || '(not provided)'}
Forbidden Testing: ${programScope.forbiddenTesting || '(not provided)'}

Finding Title: ${finding.title}
Vulnerability Type: ${finding.vulnerabilityType}
Endpoint: ${finding.endpoint}
Severity Estimate: ${finding.severity}

Description:
${finding.description}

Steps Tested:
${finding.stepsTested}

Evidence Summary:
${finding.evidenceSummary}

Impact:
${finding.impact}

Return a JSON object with exactly these fields:
{
  "likelyValidity": "NOT_ENOUGH_EVIDENCE|POSSIBLY_VALID|LIKELY_VALID|READY_TO_REPORT",
  "reasoning": "explanation of the assessment",
  "missingEvidence": ["list of evidence the tester still needs"],
  "safeConfirmationSteps": ["safe ways to confirm the finding"],
  "impactExplanation": "clear explanation of the real-world impact",
  "possibleSeverity": "INFORMATIONAL|LOW|MEDIUM|HIGH|CRITICAL",
  "programRuleConcerns": ["any concerns about whether this violates program rules"],
  "reportTitleSuggestion": "suggested report title",
  "recommendedEvidence": ["screenshots, requests, responses to collect"]
}

Rules:
- Do not suggest destructive testing
- Do not suggest accessing real user data
- Only suggest safe validation using the user's own accounts and own test data

Return valid JSON only. No markdown fences. No extra text.`,
    },
  ];
}

// ── 5. Report Generation ──────────────────────────────────────────────────────
export function buildReportPrompt(
  finding: {
    title: string;
    vulnerabilityType: string;
    endpoint: string;
    severity: string;
    description: string;
    stepsTested: string;
    evidenceSummary: string;
    impact: string;
  },
  programName: string,
  programScope: string,
  evidence: string,
  style: string
): OllamaMessage[] {
  return [
    {
      role: 'user',
      content: `Create a professional bug bounty report in Markdown format.

Program: ${programName}
Scope: ${programScope}
Report Style: ${style}

Finding:
- Title: ${finding.title}
- Vulnerability Type: ${finding.vulnerabilityType}
- Affected Endpoint: ${finding.endpoint}
- Severity: ${finding.severity}
- Description: ${finding.description}
- Steps Tested: ${finding.stepsTested}
- Evidence Summary: ${finding.evidenceSummary}
- Impact: ${finding.impact}

Evidence:
${evidence || '(No evidence provided yet)'}

Write the report in Markdown with these sections:
# [Title]
## Summary
## Affected Asset
## Vulnerability Type
## Severity
## Steps to Reproduce
## Proof of Concept Description
## Impact
## Evidence
## Recommended Fix
## Scope and Safety Notes
## Additional Notes

Rules:
- Be clear and professional
- Do not exaggerate
- Do not invent evidence
- Clearly mark missing evidence as [TO BE ADDED]
- Avoid harmful exploit instructions
- Keep suitable for bug bounty submission

Return the complete Markdown report only.`,
    },
  ];
}

// ── 6. Learning Question ──────────────────────────────────────────────────────
export function buildLearningPrompt(question: string): OllamaMessage[] {
  return [
    {
      role: 'user',
      content: `A bug bounty hunter is asking a learning question. Answer in beginner-friendly language.

Question: ${question}

Answer with:
1. A clear, simple explanation
2. A practical example if helpful
3. Safe testing notes where relevant
4. Any important warnings

Keep the answer helpful, educational, and appropriate for authorized bug bounty work.`,
    },
  ];
}

// ── 7. Daily Log Summary ──────────────────────────────────────────────────────
export function buildDailyLogSummaryPrompt(log: {
  whatTested: string;
  toolsUsed: string;
  whatFound: string;
  blockers: string;
  nextSteps: string;
  notes: string;
}): OllamaMessage[] {
  return [
    {
      role: 'user',
      content: `Summarize this bug bounty work session and suggest next steps.

What Was Tested:
${log.whatTested}

Tools Used:
${log.toolsUsed}

What Was Found:
${log.whatFound}

Blockers:
${log.blockers}

Planned Next Steps:
${log.nextSteps}

Additional Notes:
${log.notes}

Return a JSON object:
{
  "summary": "2-3 sentence summary of the session",
  "keyFindings": ["notable things found or confirmed"],
  "suggestedNextSession": ["prioritized actions for the next session"],
  "openQuestions": ["unanswered questions to investigate"]
}

Return valid JSON only. No markdown fences. No extra text.`,
    },
  ];
}
