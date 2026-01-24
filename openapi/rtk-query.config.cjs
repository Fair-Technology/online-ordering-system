/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
module.exports = {
  schemaFile: './swagger.json',
  apiFile: '../src/services/emptyApi.ts',
  apiImport: 'emptyApi',
  outputFile: '../src/services/api.ts',
  exportName: 'api',
  hooks: true,
  tag: true,
  flattenArg: true,
};
