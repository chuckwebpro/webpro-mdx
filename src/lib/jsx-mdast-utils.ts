import type { RootContent } from 'mdast';

export function isMdxJsxFlowElement(
  node: unknown,
): node is {
  type: 'mdxJsxFlowElement';
  name: string | null;
  attributes?: unknown[];
  children?: RootContent[];
} {
  return (
    typeof node === 'object' &&
    node !== null &&
    (node as { type?: string }).type === 'mdxJsxFlowElement'
  );
}

function isMdxJsxAttribute(
  value: unknown,
): value is { type: 'mdxJsxAttribute'; name: string; value: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: string }).type === 'mdxJsxAttribute' &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

function isExpressionValue(
  value: unknown,
): value is { type: string; value: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'value' in value &&
    typeof (value as { value: unknown }).value === 'string'
  );
}

type RockFlowElement = {
  type: 'mdxJsxFlowElement';
  name: 'Rock';
  attributes?: unknown[];
  children?: RootContent[];
};

export function isRockNode(node: unknown): node is RockFlowElement {
  return isMdxJsxFlowElement(node) && node.name === 'Rock';
}

function parseRockN(node: unknown): number {
  if (!isRockNode(node)) return 0;

  for (const attr of node.attributes ?? []) {
    if (isMdxJsxAttribute(attr) && attr.name === 'n' && isExpressionValue(attr.value)) {
      return parseInt(attr.value.value, 10) || 0;
    }
  }

  return 0;
}

export function getNextRockNumber(children: RootContent[]): number {
  let max = 0;
  for (const child of children) {
    max = Math.max(max, parseRockN(child));
  }
  return max + 1;
}

export function createRockNode(n: number): RootContent {
  return {
    type: 'mdxJsxFlowElement',
    name: 'Rock',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'n',
        value: { type: 'mdxJsxAttributeValueExpression', value: String(n) },
      },
      {
        type: 'mdxJsxAttribute',
        name: 'label',
        value: 'New item title',
      },
    ],
    children: [],
  };
}

type CraftRowFlowElement = {
  type: 'mdxJsxFlowElement';
  name: 'CraftRow';
  attributes?: unknown[];
  children?: RootContent[];
};

export function isCraftRowNode(node: unknown): node is CraftRowFlowElement {
  return isMdxJsxFlowElement(node) && node.name === 'CraftRow';
}

function parseCraftRowN(node: unknown): string {
  if (!isCraftRowNode(node)) return '';

  for (const attr of node.attributes ?? []) {
    if (isMdxJsxAttribute(attr) && attr.name === 'n' && typeof attr.value === 'string') {
      return attr.value.toUpperCase();
    }
  }

  return '';
}

export function getNextCraftRowLetter(children: RootContent[]): string {
  let maxCode = 64;

  for (const child of children) {
    const letter = parseCraftRowN(child);
    if (letter.length === 1) {
      const code = letter.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        maxCode = Math.max(maxCode, code);
      }
    }
  }

  return String.fromCharCode(Math.min(maxCode + 1, 90));
}

export function createCraftRowNode(n: string): RootContent {
  return {
    type: 'mdxJsxFlowElement',
    name: 'CraftRow',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'n',
        value: n,
      },
      {
        type: 'mdxJsxAttribute',
        name: 'label',
        value: 'New discipline',
      },
    ],
    children: [],
  };
}
