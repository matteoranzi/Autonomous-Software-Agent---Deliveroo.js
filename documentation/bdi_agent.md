![Desires Generation Triggers](imgs/desires_generation_triggers.png)

```
Belief update (parcel/agent/map/self)
│
├─ "desire-relevant"? ──yes──▶ regenerate desire list (event-driven)
│
▼
(always) update raw belief state

Independently, on a timer:
selectBest(currentDesires, beliefs) ──▶ possibly switch intention
```

---


Why not a raw fixed-tick loop: your most expensive step (PDDL planning) has real wall-clock cost — spawning/solving takes tens to hundreds of ms, not free. A loop ticking independent of whether        
anything actually changed either wastes cycles re-planning when nothing's new, or risks overlapping planning calls if the interval is shorter than a plan takes. It's also redundant with information you
already get for free: onSensing already arrives at the server's own fixed cadence (gameConfig.clock), so a separate independent timer is a second, uncoordinated clock competing with the one you        
already have.

Why not purely event-driven either: some things that should trigger reconsideration aren't discrete events at all — parcel rewards decay continuously (decay_interval), so the best available option can
shift purely from time passing even with zero new sensing packets. A design that only reacts to "new data arrived" will miss "my current target parcel decayed below a better alternative" until the next
sensing tick happens to also carry new info.

Concrete shape: one _deliberate() method in BDI_Agent, called from:
- onSensing / onYou handlers (new information).
- Whenever the current intention completes or fails (need a new one now).
- A slow, low-frequency backstop timer (seconds, not the sensing cadence) — purely to catch decay-driven reprioritization when nothing discrete triggered it.

Inside _deliberate(), don't treat every trigger as "regenerate everything and possibly switch." Cheaply re-check the current intention's isValid() every time; only run the full generate→filter→score   
pipeline (and only actually switch intentions) when there's no current intention, the current one is now invalid, or it's clearly outclassed. This is the standard BDI "commitment strategy" tradeoff    
(Bratman): fully open-minded reconsideration (rethink everything on every tick) risks never finishing a multi-step pickup because something marginally better always exists; fully blind commitment      
(never reconsider) misses genuinely better opportunities or fails to notice a goal became impossible. Reconsidering only on completion/failure/invalidation — "single-minded" commitment — is the usual  
middle ground, and maps cleanly onto isValid() already existing as a cheap per-tick check separate from the expensive evaluateValue() pass.

Want me to scaffold _deliberate() in BDI_Agent along these lines once DesireGenerator exists?   