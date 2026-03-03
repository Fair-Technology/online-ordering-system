/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
module.exports = {
  schemaFile: './swagger.json',
  apiFile: '../src/services/baseApi.ts',
  apiImport: 'baseApi',
  outputFile: '../src/services/api.ts',
  exportName: 'api',
  hooks: true,
  tag: true,
  flattenArg: true,
};
