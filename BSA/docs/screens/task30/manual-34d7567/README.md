# Repaired-source direct keyboard and contrast observations

**Bounded direct observations, not WCAG certification.** These checks are
separate from the complete hosted inventory and the independent image review.
The original `manual-b05b06a` observations remain unchanged.

Source `34d7567917a4c2fcdb447e2a9a0239d2c8cebe0e`, built
`2026-09-13T22:44:23.705Z`, was clean before and after direct inspection from
`2026-09-13T22:54:31.447Z` to `2026-09-13T22:57:24.452Z`, with a native-radio measurement clarification on
the same clean source at `2026-09-13T22:59:28.825Z`. Browser window-property
inspection found platform observers, not the instrumented BSA state observer.
The complete hosted inventory separately enforces the ordinary-build guard.
All actions involved the deployed synthetic demonstration, not real claims.

## Actual observations

| Interaction | Observed result | Raw evidence |
| --- | --- | --- |
| At 360 by 900, Enter opens navigation, then three Tabs from Close | Pharmacy claims receives keyboard focus and retains `aria-current=page`; its full 237 by 36 rectangle stays inside the viewport | `manual-34d7567-focus-light.json`, `manual-34d7567-focus-dark.json` |
| Focused route, light theme | Solid 2px opaque outline, sRGB 23/23/23 on 255/255/255, **17.928:1** | `manual-34d7567-focus-light.json` |
| Focused route, dark theme | Solid 2px opaque outline, sRGB 250/250/250 on 10/10/10, **18.968:1** | `manual-34d7567-focus-dark.json` |
| Escape, both themes | Dialog closes and focus returns to Open navigation; pharmacy claims URL remains unchanged | `manual-34d7567-escape-light.json`, `manual-34d7567-escape-dark.json` |
| Enter records an empty reason in the assisted B review | Full error receives focus below the header. Error plus operator narrative totals 19 words; reason and RB code remain empty and approval unchecked | `manual-34d7567-operator-error.json` |
| Type a reason, Tab to Record decision, Enter without RB code | Full RB error receives focus; the typed reason is preserved and approval stays unchecked | `manual-34d7567-rb-error-values.json` |
| Select RB2B, Tab from reason to Record decision, Enter | The synthetic human decision record opens and retains the entered reason | `manual-34d7567-keyboard-recovered-record.json` |
| Load and submit the worked paper declaration | Prescriber is empty, reconciliation unchecked and no built case row exists; declared evidence is not described as a reading | `manual-34d7567-capture-pending.json` |
| Enter confirms without reconciliation | Explicit rejection receives focus below the header; no built case row appears | `manual-34d7567-capture-rejection.json` |
| Space attests reconciliation, then type in prescriber | Editing clears the checkbox. Alt+Right inside the field does not navigate or steal focus | `manual-34d7567-capture-invalidation.json` |
| Explicitly confirm with prescriber left absent | The case abstains with Missing prescriber and gate NOT RUN, not a Sufficient recommendation; image agreement remains unknown | `manual-34d7567-missing-prescriber-identity-after.json` |

Contrast calculations use actual computed CSS colours converted through a
detached canvas, alpha compositing and three-channel relative luminance.
The surrounding dialog was opaque in both observations. These measurements
establish the sampled mobile focus indicator's contrast, not all text, SVG
images, states, controls, devices or assistive technologies. Reduced motion
was enabled. Browser warnings were only Canvas2D readback-performance advice
from the measurement itself; no browser errors were observed.

The first immediate post-Escape sample preceded asynchronous focus restoration.
The saved observations wait for the actual Open navigation focus, rather than
assuming synchronous restoration. The operator-error raw `radioCount: 0`
counts only explicit `[role=radio]` elements, not native radio inputs; it is
not an accessibility-tree count. A separate direct follow-up recorded all five
native inputs, their enabled state and the selected referral, using both
`getByRole` and native-input inspection. See
`manual-34d7567-native-radio-count-correction.json`; the first sample is
unchanged rather than silently corrected.

## Remaining automated uncertainty

The new hosted bundle retains 18 audits with incomplete items: 129
colour-contrast node occurrences and four empty-table header occurrences
across two audits. These are not violations or unique affected-node counts.
The prior disposition of synthetic SVG text, overlap analysis and empty
filtered lanes remains historical context, not a blanket waiver on this
source. This bounded direct inspection does not newly certify every incomplete
node or repeat every earlier manual route. The independent reviewer must still
inspect every new screenshot at full height.
