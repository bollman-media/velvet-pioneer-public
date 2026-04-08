# Design Decision Log — Lyria Radio Sprint

## Session: 2026-04-07 — Layered Design Sprint (Chat UI + Mini Player)

---

- ID: DDL-001
- Component: `.msg-user-text` — User chat bubble
- Change: `background: #fff; border-radius: 20px; padding: 10px 18px` → `background: #DCF1FF; border-radius: 40px; padding: 20px 24px` with dual inner-shadow
- Reason: Figma spec mandates aurora light-blue fill (`#DCF1FF`) and 40px radius pill. White bubble has no brand identity and fails to differentiate user vs system messages visually
- Impact: User prompts now read as "sent" Gemini-blue messages, creating clear conversational polarity
- System Implication: Any new chat bubble components (follow-up prompts, multi-turn) must use this spec. `#DCF1FF` is the canonical user-bubble background
- Timestamp: Session T+0m

---

- ID: DDL-002
- Component: `.music-response-loading` — Loading state
- Change: Spinner + text → full shimmer skeleton (shimmer-art, shimmer-title, shimmer-subtitle, 4× shimmer-action-dot)
- Reason: 5-10s generation latency with only a spinner creates extreme perceived wait. Shimmer skeleton matches content shape so the reveal feels expected, not surprising
- Impact: User perceives loading as purposeful crafting, not a frozen state
- System Implication: `@keyframes shimmerSweep`, `.shimmer-block`, `.shimmer-wrap` are now a shared shimmer system. Use for any card with unknown load time
- Timestamp: Session T+5m

---

- ID: DDL-003
- Component: `#btnGenerate` / `#btnGenerateAlt` — Generate → Stop affordance
- Change: Icon switches to `stop_circle` (red `#E8384F`, no spin animation) during generation. Click calls `stopGenerate()` → `AbortController.abort()`. Icon restores to `mic` on completion/abort
- Reason: A spinning `progress_activity` icon with no click behavior is a dead affordance. Users have no escape hatch during generation
- Impact: Users can cancel generation mid-flight and return to home state
- System Implication: All async action buttons should follow this pattern: idle icon → stop_circle on inflight → restore on completion. `generateController` is scoped to `runGenerate()` only
- Timestamp: Session T+10m

---

- ID: DDL-004
- Component: `.collapsed-player` → `.collapsed-player.is-mini`
- Change: Added `width var(--motion-micro)` to the `transition` property. Changed `.info` from `display: none` to `opacity: 0; pointer-events: none; max-width: 0; overflow: hidden`. Added `transition` to `.avatar` for size change
- Reason: Width jumping from 296px → 120px instantly is spatially discontinuous. Motion Hierarchy Rule: large elements transition before small
- Impact: The compact player now spatially contracts with `180ms cubic-bezier(0.4,0,0.2,1)` as the response view opens — establishing a spatial relationship between the two UI states
- System Implication: Always prefer `opacity + max-width: 0` over `display: none` for elements that need to animate in/out of collapsed containers
- Timestamp: Session T+15m

---

- ID: DDL-005
- Component: `.pill-divider`
- Change: `background: #000; opacity: 1` → `background: rgba(0,0,0,0.12)`
- Reason: Full-black divider at 100% opacity is too heavy against the white pill background. Follows the existing shell border token `--shell-border: rgba(0,0,0,0.08)` rhythm
- Impact: Divider reads as a subtle separator, not a hard rule
- System Implication: Input pill dividers should always use `rgba(0,0,0,0.08–0.12)`, not solid black
- Timestamp: Session T+18m

---

### Patterns Observed

- **Aurora blue = user-initiated actions**: `#DCF1FF` is used for user bubbles, matching the Gemini Material Aurora palette. System responses remain neutral/white.
- **Shimmer skeleton pattern**: Skeleton shape must match final content layout. `shimmer-art` (1:1 ratio) + `shimmer-meta-row` + `shimmer-actions-row` mirrors the music-response-card layout exactly.
- **Stop affordance pattern**: Any button that triggers a cancellable async operation MUST morph to a stop affordance during inflight. Icon: `stop_circle`, color: `#E8384F`, no animation.
- **Width transitions over display:none**: For collapsible containers, always use `max-width: 0` + `overflow: hidden` transitions rather than `display: none` for animatable collapses.

### Conflicts Detected

None. All decisions are net-new patterns for this component.
