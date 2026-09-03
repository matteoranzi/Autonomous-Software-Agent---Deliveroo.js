# Autonomous Software Agent - Deliveroo.js

To update modules dependency run:

    $ npm install

practical notes to use: 
rename .env.example in .env and change the token 
then use  node Deliveroo-autonomous-agent/***/script_move.js to execute a js script, from the top folder

## Services dependencies
* Deliveroo.js server → GAME
* PAAS (Planning as a Service) server → PDDL
* LiteLLM server → LLM

___

### Implementation ideas & references

- Particle filter robotics for statistical estimation of enemy position
- Dashboard for visualizing the particle filter in real-time (and all other internal states)
- Centralized vs decentralized multi-agents approaches
