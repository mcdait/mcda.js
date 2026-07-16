import { Component } from '@angular/core';

import { CriterionType, rank, TopsisDecisionProblem, vectorNormalizationCallback } from 'mcdajs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  standalone: true,
})
export class App {
  matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  result: {
    alternative: string;
    score: number;
    rank: number;
  }[] = [];

  ngOnInit() {
    this.compute();
  }

  compute() {
    const problem = new TopsisDecisionProblem();

    problem.matrix = this.matrix;

    problem.weights = [1 / 3, 1 / 3, 1 / 3];

    problem.types = [CriterionType.BENEFIT, CriterionType.COST, CriterionType.BENEFIT];

    problem.alternatives = ['A1', 'A2', 'A3'];

    problem.criteria = ['C1', 'C2', 'C3'];

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
  }
}
