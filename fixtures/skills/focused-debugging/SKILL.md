---
name: focused-debugging
description: Diagnose an unproven root cause by tracing inputs, state ownership, and component boundaries. Use after a small investigation leaves competing explanations.
---

# Focused debugging

Find the failing boundary using a minimal reproduction. Compare correct and failing inputs, including identity and ownership. State one falsifiable explanation, test it with the smallest useful observation, then fix the source. Reuse existing tests when they demonstrate the behavior. Do not expand into a design process unless evidence reveals a design issue.
