// TODO: exploration strategy: find a tile that maximizes the number of unknown tiles in the sensing radius, and move towards it. If there are multiple such tiles, choose the closest one. If there are no such tiles, choose a random tile that is not a wall and is not occupied by another agent.
//  such exploration strategy in some scenarios should be preferred over pickup (e.g. in an area where there are directional tiles and so the agent will "look-ahead" and see if in other areas is there anything interesting)

import {Goal, IDesire, IDesireEvaluation, DesireCategory} from "@/agents/BDI_Agent/desires/IDesire";

class MaximumCoverageExploreParcelSpawningTileDesire implements IDesire {
    goal: Goal;
    readonly name: string;
    readonly category: DesireCategory = DesireCategory.EXPLORE;

    evaluate(): Promise<IDesireEvaluation> {
        throw new Error("MaximumCoverageExploreParcelSpawningTileDesire not implemented.");
    }

    isValid(): boolean {
        return false;
    }
}