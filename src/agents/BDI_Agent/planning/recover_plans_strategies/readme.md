**Add a smart reconsideration mechanism for failed plans**
(e.g. "abort immediately if the blocking rival isn't moving") -> this would need full Belief context

> A utility function that tells whether to retry or replan immediately.
> **OR BETTER**: Replan immediately and if the new plan is not so worse than the previous one,
> apply the new plan immediately, otherwise retry the previous plan 
> (with the old plan loosing priority every time a new replan is triggered).

**Make composable recovery strategies for failed plans**:
E.g., RetryThenReplan -> RetryThenAbort.
