import { useCallback, useMemo } from 'react';
import {
  NestedLexicalEditor,
  useMdastNodeUpdater,
  type JsxEditorProps,
} from '@mdxeditor/editor';
import { getComponentDisplayName } from '../../lib/components';
import { InlinePropertyEditor } from './InlinePropertyEditor';

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

/** Like GenericJsxEditor but keeps empty string attributes to avoid editor crashes. */
export function InlinePropsJsxEditor({ mdastNode, descriptor }: JsxEditorProps) {
  const updateMdastNode = useMdastNodeUpdater();

  const properties = useMemo(
    () =>
      descriptor.props.reduce<Record<string, string>>((acc, { name }) => {
        const attribute = mdastNode.attributes.find((attr) =>
          isMdxJsxAttribute(attr) ? attr.name === name : false,
        );
        if (attribute) {
          if (isExpressionValue(attribute.value)) {
            acc[name] = attribute.value.value;
            return acc;
          }
          if (typeof attribute.value === 'string') {
            acc[name] = attribute.value;
            return acc;
          }
        }
        acc[name] = '';
        return acc;
      }, {}),
    [mdastNode, descriptor],
  );

  const onChange = useCallback(
    (values: Record<string, string>) => {
      const updatedAttributes: Array<{
        type: 'mdxJsxAttribute';
        name: string;
        value: string | { type: 'mdxJsxAttributeValueExpression'; value: string };
      }> = [];

      for (const prop of descriptor.props) {
        const value = values[prop.name] ?? '';

        if (value === '' && !prop.required) {
          continue;
        }

        if (prop.type === 'expression') {
          if (value === '') continue;
          updatedAttributes.push({
            type: 'mdxJsxAttribute',
            name: prop.name,
            value: { type: 'mdxJsxAttributeValueExpression', value },
          });
          continue;
        }

        updatedAttributes.push({
          type: 'mdxJsxAttribute',
          name: prop.name,
          value,
        });
      }

      updateMdastNode({ attributes: updatedAttributes });
    },
    [descriptor, updateMdastNode],
  );

  const showNameOnly =
    descriptor.props.length === 0 && descriptor.hasChildren && descriptor.kind === 'flow';

  const componentName = mdastNode.name ?? '';
  const displayName = getComponentDisplayName(componentName);

  return (
    <div className={descriptor.kind === 'text' ? 'jsx-inline-block' : 'jsx-block-editor'}>
      {showNameOnly && (
        <span className="jsx-component-name">{displayName || 'Fragment'}</span>
      )}
      {descriptor.props.length > 0 && (
        <InlinePropertyEditor
          properties={properties}
          title={displayName}
          onChange={onChange}
        />
      )}
      {descriptor.hasChildren ? (
        <NestedLexicalEditor
          block={descriptor.kind === 'flow'}
          getContent={(node) => ('children' in node ? node.children : [])}
          getUpdatedMdastNode={(node, children) =>
            ({ ...node, children }) as typeof node
          }
        />
      ) : (
        !descriptor.props.length && (
          <span className="jsx-component-name">{displayName}</span>
        )
      )}
    </div>
  );
}
