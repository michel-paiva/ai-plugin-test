# Fit-related return reasons

Return reasons are keys such as `return_reasons.too_small`. These are Returnista's standard keys; a Store can add its own, so always list the keys in use first (query 2) and sort any unknown one by its description.

| Group | Keys | Meaning |
|---|---|---|
| Too small | `too_small`, `too_tight`, `too_narrow`, `too_short`, `too_small_and_dont_like_the_colour` | The item is smaller than expected |
| Too large | `too_large`, `too_wide`, `too_long`, `too_large_and_dont_like_the_colour` | The item is bigger than expected |
| Fit in general | `fit_not_as_expected`, `ordered_wrong_size` | Doesn't fit, no direction given |
| Several sizes ordered | `ordered_multiple_sizes`, `ordered_more_than_one_size` | Bracketing: bought sizes to try, kept one |
| Not fit (report apart) | `received_wrong_size` | The shop sent the wrong size: a picking error |

All keys start with `return_reasons.`. In SQL, match on the part after it:

```sql
countIf(replaceOne(ifNull(return_reason_key, ''), 'return_reasons.', '') IN
  ('too_small', 'too_tight', 'too_narrow', 'too_short', 'too_small_and_dont_like_the_colour')) AS "Too small",
countIf(replaceOne(ifNull(return_reason_key, ''), 'return_reasons.', '') IN
  ('too_large', 'too_wide', 'too_long', 'too_large_and_dont_like_the_colour')) AS "Too large"
```

`too_thin`, `too_thick`, `too_heavy`, `too_light`, `too_soft` and `too_hard` are about the material, not the fit: leave them out unless the merchant includes them.
