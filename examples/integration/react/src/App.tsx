import { useEffect, useState } from "react";

import { CriterionType, rank, TopsisDecisionProblem, vectorNormalizationCallback } from "mcdajs";

type Result = {
  alternative: string;
  score: number;
  rank: number;
};

export default function App() {
  const [matrix, setMatrix] = useState<number[][]>([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]);

  const [result, setResult] = useState<Result[]>([]);

  useEffect(() => {
    compute();
  }, [matrix]);

  function compute() {
    const problem = new TopsisDecisionProblem();

    problem.matrix = matrix;
    problem.weights = [1 / 3, 1 / 3, 1 / 3];

    problem.types = [CriterionType.BENEFIT, CriterionType.COST, CriterionType.BENEFIT];

    problem.alternatives = ["A1", "A2", "A3"];
    problem.criteria = ["C1", "C2", "C3"];

    problem.normalizationCallback = vectorNormalizationCallback;

    const scores = problem.scores;
    const ranks = rank(scores);

    const result = problem.alternatives
      .map((alternative, i) => ({
        alternative,
        score: scores[i],
        rank: ranks[i],
      }))
      .sort((a, b) => a.rank - b.rank);

    setResult(result);
  }

  function updateValue(rowIndex: number, columnIndex: number, value: number) {
    const newMatrix = matrix.map((row) => [...row]);

    newMatrix[rowIndex][columnIndex] = value;

    setMatrix(newMatrix);
  }

  return (
    <>
      <h1>MCDA.js React Example (TOPSIS)</h1>

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
          {matrix.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th>A{rowIndex + 1}</th>

              {row.map((value, columnIndex) => (
                <td key={columnIndex}>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateValue(rowIndex, columnIndex, Number(e.target.value))}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2>TOPSIS Ranking</h2>

      <ol>
        {result.map((item) => (
          <li key={item.alternative}>
            {item.alternative}: {item.score.toFixed(6)}
          </li>
        ))}
      </ol>
    </>
  );
}
