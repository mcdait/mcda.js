<script lang="ts">
import { defineComponent } from "vue";
import epi2026 from "./epi2026.json";
import {
  CriterionType,
  minMaxNormalizationCallback,
  rank,
  SawDecisionProblem,
  TopsisDecisionProblem,
  VikorDecisionProblem,
  PrometheeDecisionProblem,
  WaspasDecisionProblem,
  linearPreference,
} from "mcdajs";

import * as Plot from "@observablehq/plot";

const initialWeights = {
  HLT: 0.45,
  ECO: 0.25,
  PCC: 0.3,
};

type Settings = {
  vikor_v: number;
  waspas_lambda: number;
  promethee_p_std_percent: number;
  promethee_q_std_percent: number;
};

const initialSettings: Settings = {
  vikor_v: 0.5,
  waspas_lambda: 0.5,
  promethee_p_std_percent: 1.0,
  promethee_q_std_percent: 0.5,
};

type Rankings = {
  [method: string]: number[];
};

const emptyRankings = (): Rankings => ({
  saw: [],
  topsis: [],
  vikor: [],
  waspas: [],
  promethee: [],
});

const rankingMethods = ["saw", "topsis", "vikor", "waspas", "promethee"] as const;

const rankingDifference = (current: number[], previous?: number[]): number[] =>
  current.map((value, index) => value - (previous?.[index] ?? value));

export default defineComponent({
  name: "App",
  data(): {
    epi: {
      [iso: string]: {
        [criterion: string]: number;
      };
    };
    weights: {
      [criterion: string]: number;
    };
    newWeights: {
      [criterion: string]: number;
    };
    rankingsDiff: Rankings;
    settings: Settings;
    newSettings: Settings;
  } {
    return {
      epi: epi2026,
      weights: { ...initialWeights },
      newWeights: { ...initialWeights },
      rankingsDiff: emptyRankings(),
      settings: { ...initialSettings },
      newSettings: { ...initialSettings },
    };
  },
  computed: {
    countries() {
      return Object.keys(this.epi);
    },
    criteria() {
      return Object.keys(this.weights);
    },
    weightsArray() {
      return Object.values(this.weights);
    },
    decisionProblems() {
      const problems: {
        saw?: SawDecisionProblem;
        topsis?: TopsisDecisionProblem;
        vikor?: VikorDecisionProblem;
        waspas?: WaspasDecisionProblem;
        promethee?: PrometheeDecisionProblem;
      } = {};

      problems.saw = new SawDecisionProblem();
      problems.saw.matrixObj = this.epi;
      problems.saw.weights = this.weightsArray;
      problems.saw.types = this.criteria.map((criterion) => CriterionType.BENEFIT);
      problems.saw.normalizationCallback = minMaxNormalizationCallback;
      problems.saw.enableDebug(true);

      problems.topsis = new TopsisDecisionProblem();
      problems.topsis.matrixObj = this.epi;
      problems.topsis.weights = this.weightsArray;
      problems.topsis.types = this.criteria.map((criterion) => CriterionType.BENEFIT);
      problems.topsis.normalizationCallback = minMaxNormalizationCallback;
      problems.topsis.enableDebug(true);

      problems.vikor = new VikorDecisionProblem();
      problems.vikor.matrixObj = this.epi;
      problems.vikor.weights = this.weightsArray;
      problems.vikor.types = this.criteria.map((criterion) => CriterionType.BENEFIT);
      problems.vikor.normalizationCallback = minMaxNormalizationCallback;
      problems.vikor.v = this.settings.vikor_v;
      problems.vikor.enableDebug(true);

      problems.waspas = new WaspasDecisionProblem();
      problems.waspas.matrixObj = this.epi;
      problems.waspas.weights = this.weightsArray;
      problems.waspas.types = this.criteria.map((criterion) => CriterionType.BENEFIT);
      problems.waspas.normalizationCallback = minMaxNormalizationCallback;
      problems.waspas.lambda = this.settings.waspas_lambda;
      problems.waspas.enableDebug(true);

      problems.promethee = new PrometheeDecisionProblem();
      problems.promethee.matrixObj = this.epi;
      problems.promethee.weights = this.weightsArray;
      problems.promethee.types = this.criteria.map((criterion) => CriterionType.BENEFIT);
      problems.promethee.enableDebug(true);

      const stdevs: [number, number, number] = [14.65, 5.88, 9.77];

      problems.promethee.preferenceFunctions = [
        linearPreference(
          this.settings.promethee_p_std_percent * stdevs[0],
          this.settings.promethee_q_std_percent * stdevs[0],
        ),
        linearPreference(
          this.settings.promethee_p_std_percent * stdevs[1],
          this.settings.promethee_q_std_percent * stdevs[1],
        ),
        linearPreference(
          this.settings.promethee_p_std_percent * stdevs[2],
          this.settings.promethee_q_std_percent * stdevs[2],
        ),
      ];

      return problems;
    },
    rankings(): Rankings {
      return {
        saw: rank(this.decisionProblems.saw!.scores),
        topsis: rank(this.decisionProblems.topsis!.scores),
        vikor: rank(this.decisionProblems.vikor!.scores, false),
        waspas: rank(this.decisionProblems.waspas!.scores),
        promethee: rank(this.decisionProblems.promethee!.scores),
      };
    },
  },
  mounted(): any {
    this.drawPlot();
  },
  methods: {
    resetWeights() {
      this.weights = { ...initialWeights };
      this.newWeights = { ...initialWeights };
    },
    applyWeights() {
      this.weights = { ...this.newWeights };
    },
    resetSettings() {
      this.settings = { ...initialSettings };
      this.newSettings = { ...initialSettings };
    },
    applySettings() {
      this.settings = { ...this.newSettings };
    },
    async togglePlotFullscreen(): Promise<void> {
      const plot = document.getElementById("plot");
      if (!plot) {
        throw new Error("Plot container not found.");
      }

      if (document.fullscreenElement === plot) {
        await document.exitFullscreen();
      } else {
        await plot.requestFullscreen();
      }
    },
    downloadPlotSvg(): void {
      const svg = document.querySelector<SVGSVGElement>("#plot");
      if (!svg) {
        throw new Error("Plot SVG not found.");
      }

      const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = "rankings.svg";
      download.click();
      URL.revokeObjectURL(url);
    },
    drawPlot() {
      const rankingBars = this.countries.flatMap((country, index) =>
        rankingMethods.map((method) => ({
          country,
          method,
          ranking: this.rankings[method]![index],
        })),
      );
      const rankTicks = Array.from({ length: this.countries.length + 1 }, (_, rank) => rank);

      const plot = Plot.plot({
        width: 1000,
        height: 300,
        color: { legend: true },
        fx: {
          domain: this.countries,
          label: null,
          tickRotate: -90,
        },
        x: { axis: null, domain: rankingMethods },
        y: { grid: true, label: "Rank", reverse: true },
        marks: [
          Plot.ruleY(rankTicks, { stroke: "currentColor", strokeOpacity: 0.05 }),
          Plot.barY(rankingBars, {
            fx: "country",
            x: "method",
            y: "ranking",
            fill: "method",
            inset: 0.5,
            title: (d) => `${d.country} ${d.method.toUpperCase()}: ${d.ranking}`,
          }),
        ],
      });

      const div = document.querySelector("#plot");
      if (div) {
        div.innerHTML = "";
        div.append(plot);
      }
    },
  },
  watch: {
    rankings: {
      immediate: true,
      handler(current: Rankings, previous?: Rankings): void {
        this.rankingsDiff = {
          saw: rankingDifference(current.saw!, previous?.saw),
          topsis: rankingDifference(current.topsis!, previous?.topsis),
          vikor: rankingDifference(current.vikor!, previous?.vikor),
          waspas: rankingDifference(current.waspas!, previous?.waspas),
          promethee: rankingDifference(current.promethee!, previous?.promethee),
        };

        this.drawPlot();
      },
    },
  },
});
</script>

<template>
  <main class="container mt-3">
    <div class="row">
      <div class="col-12 col-lg-6">
        <div class="accordion mb-3" id="leftAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#decisionMatrix"
                aria-expanded="true"
                aria-controls="decisionMatrix"
              >
                Decision Matrix
              </button>
            </h2>
            <div id="decisionMatrix" class="accordion-collapse collapse show">
              <div class="accordion-body">
                <div class="table-responsive">
                  <table class="table table-striped table-bordered table-hover">
                    <thead>
                      <tr>
                        <th scope="col">ISO</th>
                        <th scope="col">HLT</th>
                        <th scope="col">ECO</th>
                        <th scope="col">PCC</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(entry, index) in Object.entries(epi)" :key="index">
                        <td>{{ entry[0] }}</td>
                        <td>{{ entry[1].HLT }}</td>
                        <td>{{ entry[1].ECO }}</td>
                        <td>{{ entry[1].PCC }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#weights"
                aria-expanded="false"
                aria-controls="weights"
              >
                Weights
              </button>
            </h2>
            <div id="weights" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="table-responsive">
                  <table class="table table-bordered">
                    <thead>
                      <tr>
                        <th scope="col">Criterion</th>
                        <th scope="col" class="d-flex justify-content-between">
                          <span>Weight</span>

                          <button class="btn btn-sm btn-outline-primary" @click="applyWeights">
                            Apply
                          </button>
                          <button class="btn btn-sm btn-outline-secondary" @click="resetWeights">
                            Reset
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(weight, criterion) in newWeights" :key="criterion">
                        <td>{{ criterion }}</td>
                        <td>
                          <input
                            type="number"
                            class="form-control"
                            v-model.number="newWeights[criterion]"
                            min="0.01"
                            max="0.99"
                            step="0.01"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#settings"
                aria-expanded="false"
                aria-controls="settings"
              >
                Custom Method Settings
              </button>
            </h2>
            <div id="settings" class="accordion-collapse collapse">
              <div class="accordion-body">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Parameter</th>
                      <th class="d-flex justify-content-between">
                        <span>Value</span>
                        <button class="btn btn-sm btn-outline-primary" @click="applySettings">
                          Apply
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" @click="resetSettings">
                          Reset
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>VIKOR</td>
                      <td>v</td>
                      <td>
                        <input
                          type="number"
                          class="form-control"
                          v-model.number="newSettings.vikor_v"
                          min="0.0"
                          max="1.0"
                          step="0.1"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>WASPAS</td>
                      <td>λ</td>
                      <td>
                        <input
                          type="number"
                          class="form-control"
                          v-model.number="newSettings.waspas_lambda"
                          min="0.0"
                          max="1.0"
                          step="0.1"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>PROMETHEE</td>
                      <td>p (fraction of std dev)</td>
                      <td>
                        <input
                          type="number"
                          class="form-control"
                          v-model.number="newSettings.promethee_p_std_percent"
                          min="0.0"
                          max="1.0"
                          step="0.1"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>PROMETHEE</td>
                      <td>q (fraction of std dev)</td>
                      <td>
                        <input
                          type="number"
                          class="form-control"
                          v-model.number="newSettings.promethee_q_std_percent"
                          min="0.0"
                          max="1.0"
                          step="0.1"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="accordion mb-3" id="rightAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#rankings"
                aria-expanded="true"
                aria-controls="rankings"
              >
                Rankings
              </button>
            </h2>
            <div id="rankings" class="accordion-collapse collapse show">
              <div class="accordion-body">
                <div class="table-responsive">
                  <table class="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ISO</th>
                        <th v-for="(method, index) in Object.keys(rankings)" :key="method">
                          {{ method.toUpperCase() }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(country, index) in countries" :key="country">
                        <td>{{ country }}</td>
                        <td v-for="(method, methodIndex) in Object.keys(rankings)" :key="method">
                          <div class="d-flex align-items-center gap-1">
                            <span>{{ rankings[method]?.[index] }}</span>
                            <div
                              v-if="rankingsDiff[method]?.[index]"
                              :class="`diff diff-${rankingsDiff[method]?.[index] > 0 ? 'lower' : 'higher'}`"
                            >
                              <span
                                v-if="rankingsDiff[method]?.[index] < 0"
                                class="bi bi-arrow-up"
                              ></span>
                              <span v-else class="bi bi-arrow-down"></span>
                              <span>
                                {{ rankingsDiff[method]?.[index] > 0 ? "+" : ""
                                }}{{ rankingsDiff[method]?.[index] }}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <div class="accordion mb-3" id="bottomAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button
                class="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#plotPane"
                aria-expanded="true"
                aria-controls="plotPane"
              >
                Plot
              </button>
            </h2>
            <div id="plotPane" class="accordion-collapse collapse show">
              <div class="accordion-body">
                <div class="d-flex align-items-start gap-2">
                  <div
                    id="plot"
                    class="flex-grow-1"
                    role="button"
                    @click="togglePlotFullscreen"
                  ></div>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 p-2">
              <button class="btn btn-sm btn-outline-secondary" @click="downloadPlotSvg">
                Download SVG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.diff {
  font-size: 0.8em;
}

.diff-higher {
  color: green;
}

.diff-lower {
  color: red;
}

:deep(div#plot) {
  background-color: white;
}

:deep(div#plot svg) {
  width: 100%;
}

div#plot:fullscreen {
  padding: 10px;
}
</style>
