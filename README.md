# MCDA.js

Object-oriented Multiple Criteria Decision Analysis library for JavaScript and TypeScript.

A JavaScript based extension of the Python-based reference object based MCDA software package [pyrepo-mcda](https://github.com/energyinpython/pyrepo-mcda).

[![github](https://img.shields.io/badge/github-repo-000.svg?logo=github&labelColor=gray&color=blue)](https://github.com/mcdait/mcda.js)
[![NPM Version](https://img.shields.io/npm/v/mcdajs)](https://www.npmjs.com/package/mcdajs)
[![Static Badge](https://img.shields.io/badge/doi-10.1016/j.softx.2026.102896-blue)](https://doi.org/10.1016/j.softx.2026.102896)

## Citing MCDA.js

If you use MCDA.js in your research, please cite the following paper:

[Version [1.4]- [pyrepo-mcda - reference objects based MCDA software package]](https://doi.org/10.1016/j.softx.2026.102896)

Or using Bitbtex:

DOI: [https://doi.org/10.1016/j.softx.2026.102896](https://doi.org/10.1016/j.softx.2026.102896)

```bibtex
@article{KARCZMARCZYK2026102896,
title = {Version [1.4]- [pyrepo-mcda - reference objects based MCDA software package]},
journal = {SoftwareX},
volume = {35},
pages = {102896},
year = {2026},
issn = {2352-7110},
doi = {https://doi.org/10.1016/j.softx.2026.102896},
url = {https://www.sciencedirect.com/science/article/pii/S2352711026003870},
author = {Artur Karczmarczyk and Aleksandra Bączkiewicz and Jarosław Wątróbski and Wojciech Sałabun},
keywords = {Multi-criteria decision analysis (MCDA), Strong sustainability paradigm (SSP), PROMETHEE II, Temporal decision analysis, Decision support systems (DSS), Python software}
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

- AHP (Analytic Hierarchy Process) [[1]](#ref-ahp)
- ARAS (Additive Ratio Assessment) [[2]](#ref-aras)
- COCOSO (Combined Compromise Solution) [[3]](#ref-cocoso)
- CODAS (COmbinative Distance-based ASsessment) [[4]](#ref-codas)
- COPRAS (COmplex PRoportional ASsessment) [[5]](#ref-copras)
- CRADIS (Compromise Ranking of Alternatives from Distance to Ideal Solution) [[6]](#ref-cradis)
- DARIA (Data vARIability Assessment) [[7]](#ref-daria)
- EDAS (Evaluation based on Distance from Average Solution) [[8]](#ref-edas)
- MABAC (Multi-Attributive Border Approximation area Comparison) [[9]](#ref-mabac)
- MARCOS (Measurement Alternatives and Ranking according to COmpromise Solution) [[10]](#ref-marcos)
- MULTIMOORA (Multi-Objective Optimization on the basis of Ratio Analysis) [[11]](#ref-multimoora)
- MULTIMOORA_RS (MULTIMOORA Ratio System) [[11]](#ref-multimoora)
- PROMETHEE II (Preference Ranking Organization METHod for Enrichment of Evaluations II) [[12]](#ref-promethee)
- PROSA-C (PROMETHEE-based Sustainability Assessment – Criteria) [[13]](#ref-prosac)
- PVM (Preference Vector Method) [[14]](#ref-pvm)
- SAW (Simple Additive Weighting) [[15]](#ref-saw)
- SPOTIS (Stable Preference Ordering Towards Ideal Solution) [[16]](#ref-spotis)
- Temporal PROMETHEE II [[17]](#ref-temporal-promethee)
- TOPSIS (Technique for Order of Prioritisation by Similarity to Ideal Solution) [[18]](#ref-topsis)
- VIKOR (VIšeKriterijumska Optimizacija I Kompromisno Rešenje) [[19]](#ref-vikor)
- VIKOR-SMAA (VIKOR combined with Stochastic Multicriteria Acceptability Analysis) [[20]](#ref-vikor-smaa)
- VMCM (Vector Measure Construction Method) [[21]](#ref-vmcm)
- WASPAS (Weighted Aggregates Sum Product ASsessment) [[22]](#ref-waspas)

## References

<a id="ref-ahp"></a>
[1] Saaty, T. L. (1980). The Analytic Hierarchy Process. McGraw-Hill.

<a id="ref-aras"></a>
[2] Zavadskas, E. K., Turskis, Z., & Vilutiene, T. (2009). Multiple criteria analysis of foundation instalment alternatives by applying Additive Ratio Assessment (ARAS) method. *Archives of Civil and Mechanical Engineering*, 9(4), 123–141.

<a id="ref-cocoso"></a>
[3] Yazdani, M., Zarate, P., Kazimieras Zavadskas, E., & Turskis, Z. (2019). A combined compromise solution (CoCoSo) method for multi-criteria decision-making problems. Management decision, 57(9), 2501-2519.

<a id="ref-codas"></a>
[4] Keshavarz-Ghorabaee, M. (2016). A new combinative distance-based assessment (CODAS) method for multi-criteria decision-making.

<a id="ref-copras"></a>
[5] Stefano, N. M., Casarotto Filho, N., Vergara, L. G. L., & da Rocha, R. U. G. (2015). COPRAS (Complex Proportional Assessment): state of the art research and its applications. IEEE Latin America Transactions, 13(12), 3899-3906.

<a id="ref-cradis"></a>
[6] Chakraborty, S., Chatterjee, P., & Das, P. P. (2023). Compromise ranking of alternatives from distance to ideal solution (CRADIS) method. Multi-Criteria Decision-Making Methods in Manufacturing Environments, 343-347.

<a id="ref-daria"></a>
[7] Wątróbski, J., Bączkiewicz, A., Ziemba, E., & Sałabun, W. (2022). Sustainable cities and communities assessment using the DARIA-TOPSIS method. Sustainable Cities and Society, 83, 103926.

<a id="ref-edas"></a>
[8] Keshavarz Ghorabaee, M., Zavadskas, E. K., Olfat, L., & Turskis, Z. (2015). Multi-criteria inventory classification using a new method of evaluation based on distance from average solution (EDAS). Informatica, 26(3), 435-451.

<a id="ref-mabac"></a>
[9] Pamučar, D., & Ćirović, G. (2015). The selection of transport and handling resources in logistics centers using Multi-Attributive Border Approximation area Comparison (MABAC). Expert systems with applications, 42(6), 3016-3028.

<a id="ref-marcos"></a>
[10] Demir, G., Chatterjee, P., Kadry, S., Abdelhadi, A., & Pamučar, D. (2024). Measurement of alternatives and ranking according to compromise solution (MARCOS) method: a comprehensive bibliometric analysis. Decision making: applications in management and engineering, 7(2), 313-336.

<a id="ref-multimoora"></a>
[11] Brauers, W. K. M., & Zavadskas, E. K. (2010). Project management by MULTIMOORA as an instrument for transition economies. Technological and economic development of economy, 16(1), 5-24.

<a id="ref-promethee"></a>
[12] Brans, J. P., & De Smet, Y. (2005). PROMETHEE methods. In Multiple criteria decision analysis: state of the art surveys (pp. 187-219). New York, NY: Springer New York.

<a id="ref-prosa-c"></a>
[13] Ziemba, P. (2019). Towards strong sustainability management—A generalized PROSA method. Sustainability, 11(6), 1555.

<a id="ref-pvm"></a>
[14] Nermend, K. (2023). Multi-criteria and multi-dimensional analysis in decisions: decision making with preference vector methods (PVM) and vector measure construction methods (VMCM). Springer Nature.

<a id="ref-saw"></a>
[15] Fishburn, P. C. (1967). Additive utilities with incomplete product sets: Application to priorities and assignments. Operations research, 15(3), 537-542.

<a id="ref-spotis"></a>
[16] Dezert, J., Tchamova, A., Han, D., & Tacnet, J. M. (2020, July). The SPOTIS rank reversal free method for multi-criteria decision-making support. In 2020 IEEE 23rd international conference on information fusion (FUSION) (pp. 1-8). IEEE.

<a id="ref-temporal-promethee"></a>
[17] Wątróbski, J. (2023). Temporal PROMETHEE II—New multi-criteria approach to sustainable management of alternative fuels consumption. Journal of Cleaner Production, 413, 137445.

<a id="ref-topsis"></a>
[18] Hwang, C. L., & Yoon, K. (2012). Multiple attribute decision making: methods and applications a state-of-the-art survey. Springer Science & Business Media.

<a id="ref-vikor"></a>
[19] Opricovic, S., & Tzeng, G. H. (2004). Compromise solution by MCDM methods: A comparative analysis of VIKOR and TOPSIS. European journal of operational research, 156(2), 445-455.

<a id="ref-vikor-smaa"></a>
[20] Xu, C., Zhong, P. A., Zhu, F., Li, L., Lu, Q., & Yang, L. (2023). Stochastic multi-criteria decision making framework based on SMAA-VIKOR for reservoir flood control operation. Hydrological Sciences Journal, 68(6), 886-901.

<a id="ref-vmcm"></a>
[21] Piwowarski, M., Miłaszewicz, D., Łatuszyńska, M., Borawski, M., & Nermend, K. (2018). Application of the vector measure construction method and technique for order preference by similarity ideal solution for the analysis of the dynamics of changes in the poverty levels in the European union countries. Sustainability, 10(8), 2858.

<a id="ref-waspas"></a>
[22] Zavadskas, E. K., Turskis, Z., Antucheviciene, J., & Zakarevicius, A. (2012). Optimization of weighted aggregated sum product assessment. Elektronika ir elektrotechnika, 122(6), 3-6.
