# Design Memory — Decision Log

- ID: DDL-1
- Component: `.video-floating-input`
- Change: Swapped `<input>` with `<textarea>` and added focus state toggling `.keyboard-open`.
- Reason: Emulate the Luminous input's multi-line text input capabilities and auto-expansion behavior.
- Impact: Users can type long prompts and watch the container organically push downwards while staying anchored.
- System Implication: Establishes a pattern of tying focus states to component dimensions directly on parent containers.
- Timestamp: Session T+35m

---

- ID: DDL-2
- Component: `.expanded-sidebar` — expanded player panel
- Change: Height changed from fixed `500px` to `min(85vh, 680px)`. Art container height changed from `120px` to `42%` of panel.
- Reason: Fixed height truncated content on taller viewports; the mock shows art dominating ~40% of the total panel, which requires percentage-based height on the art.
- Impact: Album art is now cinematic and immersive, matching the reference mock exactly.
- System Implication: Art height is now viewport-relative — test on mobile-sized viewports.
- Timestamp: Sprint T+0m

---

- ID: DDL-3
- Component: `.expanded-sidebar` — stagger animation
- Change: Stagger targets changed from `.player-card`, `.header` (non-existent) to `.art-container`, `.scrubber-wrap`, `.controls`, `.community-panel`.
- Reason: `player-card` wrapper was removed last session; stagger was silently dead. New flat hierarchy requires targeting the direct children.
- Impact: Content now flows into view in a sequenced 60→110→150→190ms cascade when panel opens.
- System Implication: If new direct children are added to `.expanded-sidebar`, they must be added to the stagger CSS rule.
- Timestamp: Sprint T+5m

---

- ID: DDL-4
- Component: `.collapsed-player .avatar` + `crossfadeArt()`
- Change: Replaced text-initial `<div>` with dual-layer `<img>` crossfade system (`.art-back` / `.art-front`). Same pattern used for expanded art.
- Reason: The mock shows real album art as a circular thumbnail in the collapsed bar. Text initials are not in the design spec.
- Impact: Both collapsed and expanded art transition smoothly between tracks with a 480ms `cubic-bezier(0.16,1,0.3,1)` opacity crossfade.
- System Implication: `crossfadeArt(backEl, frontEl, newSrc)` is now the canonical art-swap function. Never set `img.src` directly — always route through this function.
- Timestamp: Sprint T+10m

---

- ID: DDL-5
- Component: `collapsePlayer()` / `expandPlayer()`
- Change: `collapsePlayer()` no longer calls `setPlayState(false)` or pauses the AudioContext. Audio continues uninterrupted.
- Reason: The user stated "when the player is collapsed it should continue playing." Previous implementation silently destroyed audio state on collapse.
- Impact: Music flows seamlessly between expanded/collapsed states.
- System Implication: The collapsed player's pause button is the ONLY way to stop audio. Never infer audio state from UI state.
- Timestamp: Sprint T+15m

---

- ID: DDL-6
- Component: `setPlayState()` / DOM refs
- Change: Changed `playPauseIcon` from a module-level const (assigned at parse time before DOM ready) to a lazy getter `getPlayPauseIcon()`.
- Reason: The element was being referenced before DOM was fully initialized, causing silent null writes.
- Impact: Play icon now correctly reflects audio state on first render.
- System Implication: All DOM refs for elements that might not exist should use getter functions, not module-level consts. Established pattern: `const getFoo = () => document.getElementById('foo')`.
- Timestamp: Sprint T+20m

---

- ID: DDL-7
- Component: Playback controls — event listener deduplication
- Change: Removed all redundant `addEventListener` calls for `btnExpandedPlay`, `btnExpandedNext`, `btnExpandedPrev`, `btnExpandedRemix` that existed in a second code block ~80 lines below the first.
- Reason: Double listeners caused every button press to fire the action twice — next-track fired two `playTrack()` calls sequentially, causing audio engine conflicts.
- Impact: All controls now fire exactly once per press.
- System Implication: When adding controls, add wiring once in the controls block. Search for existing listeners before adding new ones.
- Timestamp: Sprint T+25m

---

- ID: DDL-8
- Component: `.expanded-sidebar` enter/exit animation
- Change: Enter: `translateY(100%) scale(0.92)` → `translateY(0) scale(1)` via `--motion-enter` (480ms decelerate). Exit: reverse via `--motion-exit` (320ms accelerate). `transform-origin: bottom center`.
- Reason: Panel should feel like it springs up from the collapsed pill. `translateY(100%)` creates the illusion the panel is rising from below. `scale(0.92)` prevents the panel from appearing to teleport.
- Impact: The expand/collapse feels physical and grounded — the panel has weight and spring.
- System Implication: All bottom-anchored panels should use `transform-origin: bottom center` and `translateY(100%)` as the exit state.
- Timestamp: Sprint T+30m

### Patterns Observed
- **Focus-based layout expansion:** Tying `.keyboard-open` directly to root containers allows scoped children to morph naturally off input focus events.
- **Dual-layer crossfade:** When art images need to transition, always use two stacked `<img>` elements (`.art-back` / `.art-front`) with opacity-only transitions. Never animate `src` or `background-image` directly.
- **Null-safe DOM refs:** Elements that may be absent from a layout should use getter functions (`const getFoo = () => document.getElementById('foo')`), not module-level consts assigned at parse time.
- **Audio/UI independence:** `collapsePlayer()` is a UI-only state change. Audio state is owned exclusively by the audio engine and controlled only via `togglePlayPause()`.
- **Bottom-panel spring:** All bottom-anchored overlay panels use `translateY(100%) scale(0.92)` as resting state, `transform-origin: bottom center`, and spring up via `--motion-enter`.
- **Stagger must track DOM:** Stagger animation selectors must be updated whenever the DOM hierarchy of an animated container changes.
