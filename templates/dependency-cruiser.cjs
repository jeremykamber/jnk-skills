/**
 * Architecture rules for a TypeScript project.
 *
 * Copy to `.dependency-cruiser.cjs` at the repository root and edit the layers
 * to match the structure you intend — not the structure you have. Run it with:
 *
 *   npx depcruise -c .dependency-cruiser.cjs src
 *
 * The `.cjs` extension is deliberate: it is the only one that works whether or
 * not the project sets "type": "module".
 *
 * The `arch` gate in tools/adapters/typescript.json already runs that command.
 *
 * Without a compatible TypeScript compiler this tool cruises ZERO modules,
 * prints "no dependency violations found" and exits 0 — a silent pass, the
 * worst kind, because the gate looks green having checked nothing.
 * dependency-cruiser supports typescript >=2.0.0 <7.0.0, so a project on
 * TypeScript 7 hits exactly this.
 *
 * That is why the `arch` gate carries `"expect": "[1-9][0-9]* modules"`: it
 * fails the gate when the cruise finds nothing. Do not remove it. Pinning
 * `npm i -D typescript@^6` fixes the cause; the assertion is what stops the
 * cause from ever being silent again.
 *
 * An allowed-dependency list describes intended structure, not observed
 * structure. When a rule fires, decide whether the code is wrong or the rule is
 * wrong. If the right fix is an inward call, change the rule.
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'A cycle means two modules must be understood together, which is the ' +
        'thing this whole workflow is trying to avoid.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-is-pure',
      severity: 'error',
      comment:
        'The core holds the rules. It must not know about the framework, the ' +
        'database, the network, or the UI. Depend inward instead.',
      from: { path: '^src/core' },
      to: { path: '^(src/(ui|adapters|infra|db|http))' },
    },
    {
      name: 'ui-does-not-reach-past-core',
      severity: 'error',
      comment:
        'The UI talks to the core. It does not reach around it into adapters ' +
        'or persistence.',
      from: { path: '^src/ui' },
      to: { path: '^(src/(adapters|infra|db))' },
    },
    {
      name: 'adapters-depend-inward',
      severity: 'warn',
      comment:
        'Adapters implement interfaces the core owns. An adapter importing ' +
        'another adapter usually means a boundary is in the wrong place.',
      from: { path: '^src/adapters/([^/]+)/' },
      to: { path: '^src/adapters/([^/]+)/', pathNot: '^src/adapters/$1/' },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Unreachable module. Either wire it up or delete it.',
      from: { orphan: true, pathNot: '(^|/)(index|main)\\.(ts|tsx)$' },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|\\.next|dist|build|coverage)/' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
