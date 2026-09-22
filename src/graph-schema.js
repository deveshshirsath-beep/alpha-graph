import Ajv from "ajv";

export const graphDocumentSchema = {
  $id: "https://atlas.local/schemas/graph-document.json",
  type: "object",
  required: ["nodes", "edges"],
  additionalProperties: true,
  properties: {
    graphVersion: { type: ["string", "number"] },
    generatedAt: { type: "string" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "layer"],
        additionalProperties: true,
        properties: {
          id: { type: "string", minLength: 1, maxLength: 8192 },
          name: { type: "string", maxLength: 32768 },
          type: { type: "string", minLength: 1, maxLength: 256 },
          layer: { type: "string", minLength: 1, maxLength: 256 },
          properties: { type: ["object", "null"] },
        },
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "sourceId", "targetId", "relationshipType"],
        additionalProperties: true,
        properties: {
          id: { type: "string", minLength: 1, maxLength: 8192 },
          sourceId: { type: "string", minLength: 1, maxLength: 8192 },
          targetId: { type: "string", minLength: 1, maxLength: 8192 },
          relationshipType: { type: "string", minLength: 1, maxLength: 256 },
          properties: { type: ["object", "null"] },
        },
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
const validateSchema = ajv.compile(graphDocumentSchema);

function validationMessage(error) {
  const location = error.instancePath || "graph";
  return `${location} ${error.message || "is invalid"}`;
}

export class GraphValidationError extends Error {
  constructor(errors) {
    super(`Graph validation failed: ${errors.slice(0, 5).join("; ")}${errors.length > 5 ? `; and ${errors.length - 5} more` : ""}`);
    this.name = "GraphValidationError";
    this.validationErrors = errors;
  }
}

export function validateGraphDocument(document, maxErrors = 50) {
  const errors = [];
  if (!validateSchema(document)) errors.push(...(validateSchema.errors || []).map(validationMessage));
  if (!document || !Array.isArray(document.nodes) || !Array.isArray(document.edges)) return { valid: false, errors: errors.slice(0, maxErrors) };

  const nodeIds = new Set();
  for (const node of document.nodes) {
    if (!node || typeof node.id !== "string") continue;
    if (nodeIds.has(node.id)) errors.push(`duplicate node id "${node.id}"`);
    else nodeIds.add(node.id);
    if (errors.length >= maxErrors) break;
  }

  const edgeIds = new Set();
  for (const edge of document.edges) {
    if (!edge || typeof edge.id !== "string") continue;
    if (edgeIds.has(edge.id)) errors.push(`duplicate edge id "${edge.id}"`);
    else edgeIds.add(edge.id);
    if (typeof edge.sourceId === "string" && !nodeIds.has(edge.sourceId)) errors.push(`edge "${edge.id}" references missing source "${edge.sourceId}"`);
    if (typeof edge.targetId === "string" && !nodeIds.has(edge.targetId)) errors.push(`edge "${edge.id}" references missing target "${edge.targetId}"`);
    if (errors.length >= maxErrors) break;
  }
  return { valid: errors.length === 0, errors: errors.slice(0, maxErrors) };
}

export function assertValidGraphDocument(document) {
  const result = validateGraphDocument(document);
  if (!result.valid) throw new GraphValidationError(result.errors);
  return document;
}
