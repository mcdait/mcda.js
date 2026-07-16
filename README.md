# MCDA.js

Object-oriented Multiple Criteria Decision Analysis library for JavaScript and TypeScript.

[![github](https://img.shields.io/badge/github-repo-000.svg?logo=github&labelColor=gray&color=blue)](https://github.com/mcdait/mcda.js)
[![NPM Version](https://img.shields.io/npm/v/mcdajs)](https://www.npmjs.com/package/mcdajs)

## Citing MCDA.js

If you use MCDA.js in your research, please cite the following paper:

[Wątróbski, J., Jankowski, J., Ziemba, P., Karczmarczyk, A., & Zioło, M. (2019). Generalised framework for multi-criteria method selection. Omega, 86, 107-124.](https://doi.org/10.1016/j.omega.2018.07.004)

Or using Bitbtex:

DOI: [https://doi.org/10.1016/j.omega.2018.07.004](https://doi.org/10.1016/j.omega.2018.07.004)

```bibtex
@article{WATROBSKI2019107,
title = {Generalised framework for multi-criteria method selection},
journal = {Omega},
volume = {86},
pages = {107-124},
year = {2019},
issn = {0305-0483},
doi = {https://doi.org/10.1016/j.omega.2018.07.004},
url = {https://www.sciencedirect.com/science/article/pii/S0305048317308563},
author = {Jarosław Wątróbski and Jarosław Jankowski and Paweł Ziemba and Artur Karczmarczyk and Magdalena Zioło},
}
```

## Installation

Install **MCDA.js** using your preferred package manager:

```bash
npm install mcdajs
```

or

```bash
yarn add mcdajs
```

or

```bash
pnpm add mcdajs
```

or

```bash
bun add mcdajs
```

### Node.js / TypeScript / Bundlers

```ts
import {
  TopsisDecisionProblem,
  CriterionType,
} from "mcdajs";

const problem = new TopsisDecisionProblem();
```

### CommonJS

```js
const {
  TopsisDecisionProblem,
  CriterionType,
} = require("mcdajs");

const problem = new TopsisDecisionProblem();
```

### Browser (ES Modules)

```html
<script type="module">
import {
  TopsisDecisionProblem,
  CriterionType,
} from "https://esm.sh/mcdajs";

const problem = new TopsisDecisionProblem();
</script>
```

### Browser (IIFE)

```html
<script src="https://cdn.jsdelivr.net/npm/mcdajs/dist/index.iife.js"></script>

<script>
const problem = new Mcda.TopsisDecisionProblem();
</script>
```


## Quick Start

MCDA.js models every Multiple-Criteria Decision Analysis (MCDA) problem as a **decision problem**. The library provides two abstract base classes:

- **`AbstractDecisionProblem`** – base class for methods operating directly on the decision matrix (e.g. PROMETHEE).
- **`AbstractNormalizedDecisionProblem`** – extends `AbstractDecisionProblem` for methods requiring a normalization step (e.g. TOPSIS).

To solve a decision problem:

1. Choose the desired MCDA method by creating the corresponding decision problem class (e.g. `TopsisDecisionProblem` or `PrometheeDecisionProblem`).
```ts
const problem = new TopsisDecisionProblem();
```
2. Configure its public properties.
```ts
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const weights = [1 / 3, 1 / 3, 1 / 3];
const alternativeNames = ["A1", "A2", "A3"];
const criteriaNames = ["C1", "C2", "C3"];
const types = [CriterionType.BENEFIT, CriterionType.COST, CriterionType.BENEFIT];

problem.matrix = matrix;
problem.weights = weights;
problem.types = types;
problem.alternatives = alternativeNames;
problem.criteria = criteriaNames;
```

3. Read the resulting preference scores.
```ts
const scores = problem.scores;
```

At minimum, every decision problem requires:

- a **decision matrix** (`matrix`),
- **criterion weights** (`weights`),
- **criterion types** (`types`), indicating whether each criterion is a benefit or a cost (`CriterionType.BENEFIT` / `CriterionType.COST`).

Also, optional alternative and criterion names are supported through the `alternatives` and `criteria` properties.

Method-specific configuration (such as normalization callbacks for TOPSIS or preference functions for PROMETHEE) is exposed through additional public properties.

```ts
// set normalization approach to TopsisDecisionProblem
problem.normalizationCallback = vectorNormalizationCallback;
```

### Debugging intermediate computations

To inspect intermediate results produced by an MCDA method, enable debugging before computing the scores:

```ts
problem.enableDebug(true);
const scores = problem.scores;
const debugResults = problem.debugBag as TopsisDebugResults;

// type TopsisDebugResults = {
//   normalizedMatrix: number[][];
//   weightedNormalizedMatrix: number[][];
//   idealBest: number[];
//   idealWorst: number[];
//   distanceToBest: number[];
//   distanceToWorst: number[];
// };

```

The `debugBag` contains method-specific intermediate computations (such as normalized matrices, ideal solutions, preference matrices, or flow values), making it useful for debugging, validation against the literature, or educational purposes.

### Obtaining the final ranking

Every decision problem exposes the computed preference values through the `scores` getter:

```ts
const scores = problem.scores;
```

Different MCDA methods use different score semantics. For some methods (e.g. TOPSIS), **higher scores indicate better alternatives**, while for others the opposite may be true. The library provides the `rank()` utility to convert scores into rankings consistently:

```ts
const scores = problem.scores;
const ranks = rank(scores);

console.log(ranks);
```

See the **examples** directory for complete examples demonstrating usage in browser (IIFE, ESM), node usage as well as integration with Angular, React and Vue.

## Available Methods

Currently, the library supports the following MCDA methods:

- American School
  - TOPSIS (Technique for the Order of Prioritisation by Similarity to Ideal Solution) [[1]](#ref-topsis)
- European School
  - PROMETHEE II (Preference Ranking Organization METHod for Enrichment of Evaluations II) [[2]](#ref-promethee)


## References

<a name="ref-topsis">[1]</a> Hwang, C. L., & Yoon, K. (1981). Methods for multiple attribute decision making. In Multiple attribute decision making (pp. 58-191). Springer, Berlin, Heidelberg.

<a name="ref-promethee">[2]</a> Brans, J. P., Vincke, P., & Mareschal, B. (1986). How to select and how to rank projects: The PROMETHEE method. European journal of operational research, 24(2), 228-238.
