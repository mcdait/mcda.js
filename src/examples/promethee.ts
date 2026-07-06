import { PrometheeDecisionProblem } from "../core/PrometheeDecisionProblem.js";
import { CriterionType } from "../types/index.js";
import { printVectorComparison } from "../utils/comparisonTables.js";
import { vShapePreference } from "../utils/prometheePreferenceFunctions.js";
import { rank } from "../utils/ranking.js";

/**
 * PROMETHEE II published offshore wind farm location example
 *
 * Data and published results:
 * P. Ziemba, J. Watrobski, M. Ziolo, and A. Karczmarczyk,
 * "Using the PROSA Method in Offshore Wind Farm Location Problems",
 * Energies 2017, 10, 1755.
 *
 * Table 4: weights, preference directions, V-shape functions and thresholds
 * Table 5: decision matrix
 * Table 6: expected PROMETHEE II net flows and ranks
 */

type PrometheeDebugResults = {
    preferenceMatrix: number[][];
    positiveFlows: number[];
    negativeFlows: number[];
    netFlows: number[];
};

const problem = new PrometheeDecisionProblem();

problem.alternatives = ["A1", "A2", "A3", "A4"];
problem.criteria = [
    "Investment cost",
    "Payback period",
    "Distance from power stations",
    "Mean sea water depth",
    "Undersea geological condition",
    "Employment",
    "Conflict with fisheries",
    "Density of shipping traffic",
    "Distance from shore",
    "Influence on protected areas",
    "CO2 reduction",
    "SO2 reduction",
];

problem.matrix = [
    [16347, 9, 73.8, 36.7, 1.5, 3730, 2, 1, 38.8, 4, 1720524, 40012],
    [14219, 8.5, 55, 36, 2, 3240, 1, 1, 33.1, 2, 1496512, 34803],
    [8160, 9, 64.8, 28.5, 2, 1860, 2, 2, 45.8, 4, 858830, 19973],
    [8160, 8.5, 62.5, 29.5, 1.5, 1860, 1, 3, 27.3, 3, 858830, 19973],
];

// Exact fractions corresponding to the percentages rounded in Table 4.
problem.weights = [
    1 / 5,
    1 / 20,
    1 / 20,
    1 / 60,
    1 / 60,
    7 / 60,
    7 / 60,
    1 / 20,
    1 / 20,
    1 / 6,
    1 / 12,
    1 / 12,
];
problem.types = [
    CriterionType.COST,
    CriterionType.COST,
    CriterionType.COST,
    CriterionType.COST,
    CriterionType.COST,
    CriterionType.BENEFIT,
    CriterionType.COST,
    CriterionType.COST,
    CriterionType.BENEFIT,
    CriterionType.COST,
    CriterionType.BENEFIT,
    CriterionType.BENEFIT,
];
problem.preferenceFunctions = [
    vShapePreference(7280),   // C1 - Investment cost
    vShapePreference(4),      // C2 - Payback period
    vShapePreference(13.4),   // C3 - Distance from power stations
    vShapePreference(7.4),    // C4 - Mean sea water depth
    vShapePreference(3),      // C5 - Undersea geological condition
    vShapePreference(1662),   // C6 - Employment
    vShapePreference(3),      // C7 - Conflict with fisheries
    vShapePreference(3),      // C8 - Density of shipping traffic
    vShapePreference(13.8),   // C9 - Distance from shore
    vShapePreference(3),      // C10 - Influence on protected areas
    vShapePreference(766240), // C11 - CO2 reduction
    vShapePreference(17820),  // C12 - SO2 reduction
];

const publishedResults = {
    netFlows: [-0.0444, 0.1884, -0.0954, -0.0486],
    ranks: [2, 1, 4, 3],
    economicNetFlows: [-0.6256, -0.1827, 0.3724, 0.4359],
    socialNetFlows: [0.2769, 0.2415, -0.1866, -0.3318],
    environmentalNetFlows: [0.2154, 0.5065, -0.4720, -0.2498],
    meanAbsoluteDeviations: [0.3874, 0.2474, 0.3119, 0.3230],
};

function calculateGroupNetFlows(
    firstCriterionIndex: number,
    endCriterionIndex: number,
): number[] {
    const groupProblem = new PrometheeDecisionProblem();
    const groupWeights = problem.weights.slice(
        firstCriterionIndex,
        endCriterionIndex,
    );
    const groupWeightSum = groupWeights.reduce(
        (sum, weight) => sum + weight,
        0,
    );

    groupProblem.alternatives = problem.alternatives;
    groupProblem.criteria = problem.criteria.slice(
        firstCriterionIndex,
        endCriterionIndex,
    );
    groupProblem.matrix = problem.matrix.map((alternativeValues) =>
        alternativeValues.slice(firstCriterionIndex, endCriterionIndex),
    );
    groupProblem.weights = groupWeights.map(
        (weight) => weight / groupWeightSum,
    );
    groupProblem.types = problem.types.slice(
        firstCriterionIndex,
        endCriterionIndex,
    );
    groupProblem.preferenceFunctions = problem.preferenceFunctions.slice(
        firstCriterionIndex,
        endCriterionIndex,
    );
    groupProblem.enableDebug(true);

    // Calculating the scores also fills debugBag with intermediate results.
    void groupProblem.scores;

    const debugResults =
        groupProblem.debugBag as PrometheeDebugResults;

    return debugResults.netFlows;
}

problem.enableDebug(true);

// Calculating the scores also fills debugBag with intermediate results.
void problem.scores;

const debugResults = problem.debugBag as PrometheeDebugResults;
const netFlows = debugResults.netFlows;
const ranks = rank(netFlows);

// Criterion group ranges correspond to Table 4:
// economic C1-C5, social C6-C9, environmental C10-C12.
const economicNetFlows = calculateGroupNetFlows(0, 5);
const socialNetFlows = calculateGroupNetFlows(5, 9);
const environmentalNetFlows = calculateGroupNetFlows(9, 12);

const meanAbsoluteDeviations = problem.alternatives.map(
    (_, alternativeIndex) => {
        const globalNetFlow = netFlows[alternativeIndex];
        const groupNetFlows = [
            economicNetFlows[alternativeIndex],
            socialNetFlows[alternativeIndex],
            environmentalNetFlows[alternativeIndex],
        ];
        const sumOfAbsoluteDifferences = groupNetFlows.reduce(
            (sum, groupNetFlow) =>
                sum + Math.abs(groupNetFlow - globalNetFlow),
            0,
        );

        return sumOfAbsoluteDifferences / groupNetFlows.length;
    },
);

console.log("PROMETHEE II offshore wind farm results:");
printVectorComparison(
    "Global net flows",
    problem.alternatives,
    netFlows,
    publishedResults.netFlows,
);
printVectorComparison(
    "Ranks",
    problem.alternatives,
    ranks,
    publishedResults.ranks,
    0,
);
printVectorComparison(
    "Economic net flows",
    problem.alternatives,
    economicNetFlows,
    publishedResults.economicNetFlows,
);
printVectorComparison(
    "Social net flows",
    problem.alternatives,
    socialNetFlows,
    publishedResults.socialNetFlows,
);
printVectorComparison(
    "Environmental net flows",
    problem.alternatives,
    environmentalNetFlows,
    publishedResults.environmentalNetFlows,
);
printVectorComparison(
    "Mean absolute deviations",
    problem.alternatives,
    meanAbsoluteDeviations,
    publishedResults.meanAbsoluteDeviations,
);
