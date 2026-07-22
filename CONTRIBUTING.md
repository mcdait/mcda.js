# Contributing

Thank you for your interest in contributing to **MCDA.js**!

## Reporting Issues

If you find a bug, have a feature request, or would like to contribute a new MCDA method, please open an issue first. For larger changes, discuss the proposed solution before starting implementation.

When submitting a pull request, reference the corresponding issue number in the commit message (e.g. `#42 Implement VIKOR method`).

## Development

Clone the repository and install dependencies:

```bash
npm ci
```

Before submitting a pull request, ensure that:

- the code is formatted with Prettier,
- TypeScript strict mode is preserved,
- all tests pass,
- the project builds successfully.

Useful commands:

```bash
npm test
npm run build
npm run typecheck
npm run prettier
```

## Adding a New MCDA Method

Each MCDA method should follow the project structure:

```
src/
└── methods/
    └── <method>/
        ├── decision-problem.ts
        ├── index.ts
        └── types.ts (optional)
```

- Implement the method in `decision-problem.ts`.
- The decision problem class should extend `AbstractDecisionProblem` (directly or indirectly).
- Any method-specific types should be placed in `types.ts` within the same directory.
- Export the public API through `index.ts`.

Unit tests should be added under:

```
tests/
└── methods/
    └── <method>/
```

At a minimum:

- verify that the method computes the expected scores for a known decision problem,
- add tests for method-specific validation, edge cases, and other behavior where appropriate.

Upon changes acceptance and release, real-life scientific paper example should be provided under:

```
examples/
└── showcase/
    └── <method>.ts
```

## Documentation

Documentation improvements are always welcome. Please keep examples concise and ensure they remain consistent with the current public API.
