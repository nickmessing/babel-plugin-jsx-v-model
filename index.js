"use strict"

module.exports = babel => {
  const t = babel.types

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      Program(path) {
        path.traverse({
          JSXOpeningElement(path) {
            const vModelAttribute = path.node.attributes.filter(node => node.name.name === 'v-model')[0]

            if (!vModelAttribute) {
              return
            }

            const model = vModelAttribute.value.expression
            const replacement = []

            const isInput = path.node.name.name === 'input'
            if (isInput) {
              const typeAttributes = path.node.attributes.filter(
                node => node.name.name === 'type' && t.isStringLiteral(node.value)
              )
              const type = typeAttributes.length ? typeAttributes[0].value.value : 'text'
              if (type === 'radio') {
                const valueAttribute = path.node.attributes.filter(node => node.name.name === 'value')[0]
                let value
                if (!valueAttribute) {
                  value = t.identifier('undefined')
                } else if (t.isStringLiteral(valueAttribute.value)) {
                  value = t.stringLiteral(valueAttribute.value.value)
                } else if (t.isJSXExpressionContainer(valueAttribute.value)) {
                  value = valueAttribute.value.expression
                }

                replacement.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('domPropsChecked'),
                    t.jSXExpressionContainer(t.binaryExpression('===', model, value))
                  )
                )

                replacement.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('onChange'),
                    t.jSXExpressionContainer(
                      t.arrowFunctionExpression(
                        [t.identifier('e')],
                        t.logicalExpression(
                          '&&',
                          t.memberExpression(
                            t.memberExpression(t.identifier('e'), t.identifier('target')),
                            t.identifier('checked')
                          ),
                          t.assignmentExpression(
                            '=',
                            model,
                            t.memberExpression(
                              t.memberExpression(t.identifier('e'), t.identifier('target')),
                              t.identifier('value')
                            )
                          )
                        )
                      )
                    )
                  )
                )
              } else if (type === 'checkbox') {
                replacement.push(t.jSXAttribute(t.jSXIdentifier('domPropsChecked'), t.jSXExpressionContainer(model)))

                replacement.push(
                  t.jSXAttribute(
                    t.jSXIdentifier('onChange'),
                    t.jSXExpressionContainer(
                      t.arrowFunctionExpression(
                        [t.identifier('e')],
                        t.assignmentExpression(
                          '=',
                          model,
                          t.memberExpression(
                            t.memberExpression(t.identifier('e'), t.identifier('target')),
                            t.identifier('checked')
                          )
                        )
                      )
                    )
                  )
                )
              }
            }

            if (replacement.length === 0) {
              replacement.push(t.jSXAttribute(t.jSXIdentifier('domPropsValue'), t.jSXExpressionContainer(model)))

              replacement.push(
                t.jSXAttribute(
                  t.jSXIdentifier('onInput'),
                  t.jSXExpressionContainer(
                    t.arrowFunctionExpression(
                      [t.identifier('e')],
                      t.assignmentExpression(
                        '=',
                        model,
                        t.memberExpression(
                          t.memberExpression(t.identifier('e'), t.identifier('target')),
                          t.identifier('value')
                        )
                      )
                    )
                  )
                )
              )
            }

            if (replacement.length) {
              path.traverse({
                JSXAttribute(path) {
                  if (path.node !== vModelAttribute) {
                    return
                  }
                  path.replaceWithMultiple(replacement)
                }
              })
            }
          }
        })
      }
    }
  }
}
