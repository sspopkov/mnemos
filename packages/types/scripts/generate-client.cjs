const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const SPEC_PATH = path.join(SRC_DIR, 'openapi.json');
const OUTPUT_DIR = path.join(SRC_DIR, 'generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.ts');

const NAME_OVERRIDES = {
  Record: 'RecordDto',
  RecordList: 'RecordDtoList',
  CreateRecordBody: 'RecordCreateInput',
  UpdateRecordBody: 'RecordUpdateInput',
  DeleteRecordResponse: 'RecordDeleteResponse',
};

const TYPE_OVERRIDES = {
  RecordDtoList: 'RecordDto[]',
};

function readSpec() {
  if (!fs.existsSync(SPEC_PATH)) {
    throw new Error(`OpenAPI specification not found at ${SPEC_PATH}. Run pnpm -w generate:types.`);
  }
  const raw = fs.readFileSync(SPEC_PATH, 'utf8');
  return JSON.parse(raw);
}

function mapName(name) {
  return NAME_OVERRIDES[name] ?? name;
}

function refName($ref) {
  const parts = $ref.split('/');
  return mapName(parts[parts.length - 1]);
}

function schemaToType(schema) {
  if (!schema) return 'unknown';
  if (schema.$ref) {
    return refName(schema.$ref);
  }
  if (schema.const !== undefined) {
    return JSON.stringify(schema.const);
  }
  if (schema.enum) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  }
  if (schema.anyOf) {
    return schema.anyOf.map(schemaToType).join(' | ');
  }
  if (schema.allOf) {
    return schema.allOf.map(schemaToType).join(' & ');
  }
  if (schema.type === 'array') {
    return `${schemaToType(schema.items)}[]`;
  }
  if (schema.type === 'object' || schema.properties) {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    const entries = Object.entries(properties).map(([key, value]) => {
      const optional = required.has(key) ? '' : '?';
      return `  ${key}${optional}: ${schemaToType(value)};`;
    });
    const additional = schema.additionalProperties;
    if (additional && additional !== false) {
      entries.push(`  [key: string]: ${schemaToType(additional)};`);
    }
    return entries.length ? `{
${entries.join('\n')}
}` : '{ }';
  }
  if (schema.type === 'string') return 'string';
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'null') return 'null';
  return 'unknown';
}

function generateTypeDefinitions(components) {
  const schemas = components?.schemas ?? {};
  const names = Object.keys(schemas);
  names.sort((a, b) => mapName(a).localeCompare(mapName(b)));
  const lines = [];
  for (const name of names) {
    const tsName = mapName(name);
    const schema = schemas[name];
    const type = TYPE_OVERRIDES[name] ?? schemaToType(schema);
    lines.push(`export type ${tsName} = ${type};`);
  }
  lines.push('');
  lines.push('export type RecordItem = RecordDto;');
  return `${lines.join('\n')}\n`;
}

function pickSuccessResponse(responses = {}) {
  const statusCodes = Object.keys(responses)
    .map((code) => Number(code))
    .filter((code) => Number.isInteger(code) && code >= 200 && code < 300)
    .sort((a, b) => a - b);
  if (statusCodes.length === 0) return null;
  const status = String(statusCodes[0]);
  const response = responses[status];
  if (!response || !response.content) return null;
  const jsonContent = response.content['application/json'] || response.content['application/vnd.api+json'];
  if (!jsonContent) return null;
  return schemaToType(jsonContent.schema);
}

function pathParamsFromTemplate(pathTemplate) {
  const matches = [...pathTemplate.matchAll(/\{(.*?)\}/g)];
  return matches.map((match) => match[1]);
}

function parametersForOperation(pathItem = {}, operation = {}) {
  const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])];
  const result = new Map();
  for (const parameter of parameters) {
    if (!parameter || parameter.in !== 'path') continue;
    const name = parameter.name;
    const type = schemaToType(parameter.schema ?? { type: 'string' });
    result.set(name, type);
  }
  return result;
}

function requestBodyType(operation) {
  const body = operation.requestBody;
  if (!body || !body.content) return null;
  const jsonContent = body.content['application/json'] || body.content['application/vnd.api+json'];
  if (!jsonContent) return null;
  return schemaToType(jsonContent.schema);
}

function httpMethodToAxios(method) {
  switch (method.toLowerCase()) {
    case 'get':
      return 'get';
    case 'post':
      return 'post';
    case 'put':
      return 'put';
    case 'delete':
      return 'delete';
    default:
      return 'request';
  }
}

function buildUrlExpression(pathTemplate, pathParams) {
  if (pathParams.length === 0) {
    return `\`${pathTemplate}\``;
  }
  const replaced = pathTemplate.replace(/\{(.*?)\}/g, (_, name) => `\${encodeURIComponent(${name})}`);
  return `\`${replaced}\``;
}

function generateOperations(paths = {}) {
  const lines = [];
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    const pathParamsOrder = pathParamsFromTemplate(pathKey);
    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === 'parameters') continue;
      const operationId = operation.operationId;
      if (!operationId) continue;
      const responseType = pickSuccessResponse(operation.responses) ?? 'void';
      const bodyType = requestBodyType(operation);
      const paramsMap = parametersForOperation(pathItem, operation);
      const args = [];
      const paramNames = [];
      for (const paramName of pathParamsOrder) {
        if (!paramsMap.has(paramName)) continue;
        paramNames.push(paramName);
        args.push(`${paramName}: ${paramsMap.get(paramName)}`);
      }
      if (bodyType) {
        args.push(`body: ${bodyType}`);
      }
      const axiosMethod = httpMethodToAxios(method);
      const urlExpression = buildUrlExpression(pathKey, pathParamsOrder);
      const comment = operation.summary ? `  /** ${operation.summary}. */\n` : '';
      const returnType = responseType === 'void' ? 'Promise<void>' : `Promise<${responseType}>`;
      const linesForMethod = [];
      linesForMethod.push(`${comment}  async ${operationId}(${args.join(', ')}): ${returnType} {`);
      if (axiosMethod === 'request') {
        linesForMethod.push(`    const response = await this.http.request<${responseType}>({ url: ${urlExpression}, method: '${method.toUpperCase()}'${bodyType ? ', data: body' : ''} });`);
      } else if (axiosMethod === 'get' || axiosMethod === 'delete') {
        linesForMethod.push(`    const response = await this.http.${axiosMethod}<${responseType}>(${urlExpression});`);
      } else {
        const dataArg = bodyType ? 'body' : 'undefined';
        linesForMethod.push(`    const response = await this.http.${axiosMethod}<${responseType}>(${urlExpression}, ${dataArg});`);
      }
      if (responseType === 'void') {
        linesForMethod.push('    return;');
      } else {
        linesForMethod.push('    return response.data;');
      }
      linesForMethod.push('  }');
      lines.push(linesForMethod.join('\n'));
      lines.push('');
    }
  }
  return lines.join('\n').trimEnd();
}

function generateFile(spec) {
  const header = `// This file is auto-generated by packages/types/scripts/generate-client.cjs.\n// Do not edit this file directly.\n`;
  const typeDefs = generateTypeDefinitions(spec.components);
  const operations = generateOperations(spec.paths);
  const lines = [
    header,
    "import type { AxiosInstance, AxiosRequestConfig } from '../http/axios';",
    "import { createAxiosInstance } from '../http/axios';",
    '',
    typeDefs,
    '',
    'export interface MnemosApiClientOptions extends AxiosRequestConfig {\n  baseURL?: string;\n}',
    '',
    'export class MnemosApiClient {',
    '  private readonly http: AxiosInstance;',
    '',
    '  constructor(http: AxiosInstance) {',
    '    this.http = http;',
    '  }',
    '',
    '  static create(options: MnemosApiClientOptions = {}) {',
    '    return new MnemosApiClient(createAxiosInstance({ withCredentials: true, ...options }));',
    '  }',
    '',
    operations,
    '}',
    '',
    'export function createMnemosApiClient(options: MnemosApiClientOptions = {}) {',
    '  return MnemosApiClient.create(options);',
    '}',
  ];
  return `${lines.join('\n')}\n`;
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function writeOutput(content) {
  ensureOutputDir();
  fs.writeFileSync(OUTPUT_FILE, content);
}

function main() {
  const spec = readSpec();
  const content = generateFile(spec);
  writeOutput(content);
  console.log(`Generated TypeScript client at ${OUTPUT_FILE}`);
}

main();
