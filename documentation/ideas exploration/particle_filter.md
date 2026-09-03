# Particle Filter for Opponent Tracking on a Discrete Map

Using a **Particle Filter** to track an invisible opponent on a discrete map based on limited data (initial position, time, and direction) is a highly effective probabilistic approach.

---

## 1. The Core Concept

The algorithm creates thousands of **"particles"** (hypotheses) that represent possible locations of the opponent. Instead of a single dot, you see a **probability cloud** or **heatmap**.

- **Density = Probability:** Areas with many particles are where the opponent is most likely to be.
- **Constraint-Aware:** Unlike simple math formulas, particles "know" the map. They cannot walk through walls or jump across gaps, making them perfect for discrete, structured environments.

---

## 2. How It Uses Your Specific Data

- **Initial Position:** All particles start at the last known coordinates (`t₀`).
- **Time & Velocity:** As time passes, particles move. The "cloud" expands outward based on the opponent's maximum possible speed.
- **Directional Bias:** If you saw them heading "North," you program the particles to have a higher probability of moving North. This transforms a generic circle into a **cone-shaped** search area.

---

## 3. The Particle Lifecycle

The filter stays accurate through a **four-step cycle**:

### Step 1 — Prediction
Particles move based on time and estimated direction + a bit of random **"noise"** to account for unpredictable behavior.

### Step 2 — Weighting
Particles that hit walls or enter areas where you *know* the opponent isn't (via sensors or cameras) are given a **weight of zero**.

### Step 3 — Resampling (The "Selection" Phase)
- **Dead particles** are deleted.
- **Successful particles** (those in logical, high-probability zones) are **cloned** to fill the gaps.
- **No Random Spawning:** Discarded particles are *not* moved to random spots; they are used to reinforce the most likely paths.

### Step 4 — Evolution
The system constantly focuses its "brainpower" on the most realistic trajectories.

---

## 4. Key Advantages for Your Case

| Advantage | Description |
|---|---|
| **Multi-modal Tracking** | If the opponent reaches a fork, the cloud splits and tracks **both paths** simultaneously until new data arrives. |
| **Negative Information** | Even if you *don't* see the opponent, that "silence" deletes particles in your line of sight, narrowing down their true location. |
| **Pathfinding Logic** | In a discrete map, particles follow actual corridors, providing a far more realistic estimate than a simple "search circle." |

---

## Summary

> The Particle Filter mimics a **"biological" search** — it keeps the leads that make sense, kills the ones that don't, and constantly evolves the search area based on the clock and the map's layout.
