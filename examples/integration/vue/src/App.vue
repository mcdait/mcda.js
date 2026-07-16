<template>
  <h1>MCDA.js Vue Example (TOPSIS)</h1>

  <p>Every matrix modification immediately recomputes the TOPSIS ranking.</p>

  <table>
    <thead>
      <tr>
        <th></th>
        <th>C1 (max)</th>
        <th>C2 (min)</th>
        <th>C3 (max)</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="(row, rowIndex) in matrix" :key="rowIndex">
        <th>A{{ rowIndex + 1 }}</th>

        <td v-for="(value, columnIndex) in row" :key="columnIndex">
          <input type="number" v-model.number="matrix[rowIndex][columnIndex]" @input="compute" />
        </td>
      </tr>
    </tbody>
  </table>

  <h2>TOPSIS Ranking</h2>

  <ol>
    <li v-for="item in result" :key="item.alternative">
      {{ item.alternative }}:
      {{ item.score.toFixed(6) }}
    </li>
  </ol>
</template>

<script>
import { CriterionType, rank, TopsisDecisionProblem, vectorNormalizationCallback } from "mcdajs";

export default {
  name: "App",

  data() {
    return {
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],

      result: [],
    };
  },

  mounted() {
    this.compute();
  },

  methods: {
    compute() {
      const problem = new TopsisDecisionProblem();

      problem.matrix = this.matrix;

      problem.weights = [1 / 3, 1 / 3, 1 / 3];

      problem.types = [CriterionType.BENEFIT, CriterionType.COST, CriterionType.BENEFIT];

      problem.alternatives = ["A1", "A2", "A3"];

      problem.criteria = ["C1", "C2", "C3"];

      problem.normalizationCallback = vectorNormalizationCallback;

      const scores = problem.scores;

      const ranks = rank(scores);

      this.result = problem.alternatives
        .map((alternative, i) => ({
          alternative,
          score: scores[i],
          rank: ranks[i],
        }))
        .sort((a, b) => a.rank - b.rank);
    },
  },
};
</script>
