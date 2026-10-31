const path = require('path');

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-module-internal-imports',
      comment: 'Modules must only import another module via its root index.ts facade.',
      severity: 'error',
      from: {
        path: '(?:^|[\\/])modules[\\/]([^\\/]+)[\\/]',
      },
      to: {
        path: '(?:^|[\\/])modules[\\/]([^\\/]+)[\\/]',
        pathNot: [
          'node_modules',
          '(?:^|[\\/])modules[\\/]$1[\\/]', // self imports are allowed
          '(?:^|[\\/])modules[\\/][^\\/]+[\\/]index\\.ts$', // facade imports are allowed
          '(?:^|[\\/])modules[\\/][^\\/]+$', // facade import directory
        ],
      },
    },
    {
      name: 'domain-purity',
      comment: 'Domain layer must be pure TypeScript. No Nest, Drizzle, or external framework imports.',
      severity: 'error',
      from: {
        path: '(?:^|[\\/])modules[\\/][^\\/]+[\\/]domain[\\/]',
      },
      to: {
        path: '(@nestjs|drizzle-orm|postgres|(?:^|[\\/])modules[\\/][^\\/]+[\\/](?!domain))',
      },
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies between files or modules are strictly forbidden.',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: path.resolve(__dirname, 'tsconfig.json'),
    },
  },
};
