---
name: regression-testing
description: Design tests for behavior boundaries or state interactions that existing checks do not cover.
---

# Regression testing

Identify the contract and a failing boundary. Prefer one meaningful reproduction over tests that repeat the implementation. For stateful behavior, check isolation, ordering and repeated calls. Run the changed scenario and related existing checks. Stop when the relevant regression risk is covered.
