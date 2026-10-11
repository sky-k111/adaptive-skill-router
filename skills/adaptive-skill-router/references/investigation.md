<!-- adaptive-workflow:reference investigation -->
# Investigation that separates explanations

Read when competing causes, timing or state remain unresolved, or an attempted fix fails. Start from the smallest failing boundary; a full project audit is not required.

## Make the next observation decisive

State the symptom as expected versus observed behavior. Locate the relevant inputs, state owners, transitions and outputs. Keep an incident report or a plausible explanation as a hypothesis until an observation supports it.

For each plausible explanation that would change the fix, identify its predicted observation and an alternative that predicts something different. Choose the cheapest controlled check that separates them. A result compatible with both leaves the question open.

For example, an old value after refresh could arise from an identity collision or a late completion. Distinct identities with no overlap probe the first; the same identity with controlled completion order probes the second. Do not infer either from an ordinary sequential pass.

Keep the compact investigation state in context or an existing project note:

| Hypothesis | Distinguishing check | Actual result | Consequence |
| --- | --- | --- | --- |
| A concrete explanation | Input or schedule and the differing predictions | Observation, failure or unrun check | Retain, reject or narrow the explanation |

This is a reasoning aid, not a mandatory report or a fixed number of hypotheses.

## Probe the relevant boundary

| Observed uncertainty | Useful controlled observation |
| --- | --- |
| Identity or scope confusion | Vary one identity component; include delimiter/alias cases only when the implementation makes them relevant |
| Ordering or shared state | Gate operations with promises/barriers; deliberately release completions in both orders and inspect the public outcome and state owner |
| A failure blocks retries | Fail once, recover the same dependency, then repeat the same operation; observe invocation count and pending-state cleanup |
| Data changes between layers | Compare the value before and after the first transformation where it can diverge |
| Environment-dependent behavior | Compare the relevant version, setting or dependency under the same input before editing unrelated code |

Use counters, traces and minimal reproductions that expose a transition. Sleeps and repeated successful runs do not establish a particular interleaving. Inject a dependency or gate at an existing boundary when possible; keep diagnostic-only instrumentation out of the delivered behavior unless required.

## Repair and reassess

Before editing, state the invariant the fix must restore. For shared asynchronous work, distinguish a caller's result from authority to update current state; completion order alone need not determine which request owns that state. Verify relevant identities, success/failure paths and completion orders independently.

When a check contradicts the explanation, retain the failure, revise the hypothesis or move the observation to another boundary. Do not repeatedly patch the same location without new evidence. Recheck affected claims after an edit; preserve findings supported by unchanged inputs and dependencies.

Finish when the reported failure and affected regressions are verified. A passing test for one order does not establish other orders; report unrun or cancelled cases accurately.
