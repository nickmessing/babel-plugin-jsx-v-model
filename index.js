const allowedModifiers = ['trim', 'number', 'lazy']
const RANGE_TOKEN = '__r'
const CHECKBOX_RADIO_TOKEN = '__c'

const htmlTags = [
  'html',
  'body',
  'base',
  'head',
  'link',
  'meta',
  'style',
  'title',
  'address',
  'article',
  'aside',
  'footer',
  'header',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hgroup',
  'nav',
  'section',
  'div',
  'dd',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'picture',
  'hr',
  'img',
  'li',
  'main',
  'ol',
  'p',
  'pre',
  'ul',
  'a',
  'b',
  'abbr',
  'bdi',
  'bdo',
  'br',
  'cite',
  'code',
  'data',
  'dfn',
  'em',
  'i',
  'kbd',
  'mark',
  'q',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
  'area',
  'audio',
  'map',
  'track',
  'video',
  'embed',
  'object',
  'param',
  'source',
  'canvas',
  'script',
  'noscript',
  'del',
  'ins',
  'caption',
  'col',
  'colgroup',
  'table',
  'thead',
  'tbody',
  'td',
  'th',
  'tr',
  'button',
  'datalist',
  'fieldset',
  'form',
  'input',
  'label',
  'legend',
  'meter',
  'optgroup',
  'option',
  'output',
  'progress',
  'select',
  'textarea',
  'details',
  'dialog',
  'menu',
  'menuitem',
  'summary',
  'content',
  'element',
  'shadow',
  'template',
  'blockquote',
  'iframe',
  'tfoot'
]

const svgTags = [
  'svg',
  'animate',
  'circle',
  'clippath',
  'cursor',
  'defs',
  'desc',
  'ellipse',
  'filter',
  'font-face',
  'foreignObject',
  'g',
  'glyph',
  'image',
  'line',
  'marker',
  'mask',
  'missing-glyph',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'rect',
  'switch',
  'symbol',
  'text',
  'textpath',
  'tspan',
  'use',
  'view'
]

const isReservedTag = tag => htmlTags.includes(tag) || svgTags.includes(tag)

const getExpression = (t, path) => (t.isStringLiteral(path.node.value) ? path.node.value : path.node.value.expression)

const genValue = (t, model) => t.jSXAttribute(t.jSXIdentifier('domPropsValue'), t.jSXExpressionContainer(model))

const genAssignmentCode = (t, model, assignment) => {
  if (model.computed) {
    const { object, property } = model
    return t.ExpressionStatement(
      t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('$set')), [object, property, assignment])
    )
  } else {
    return t.ExpressionStatement(t.AssignmentExpression('=', model, assignment))
  }
}

const genListener = (t, event, body) =>
  t.jSXAttribute(
    t.jSXIdentifier(`on${event}`),
    t.jSXExpressionContainer(t.ArrowFunctionExpression([t.Identifier('$event')], t.BlockStatement(body)))
  )

const genSelectModel = (t, modelAttribute, model, modifier) => {
  if (modifier && modifier !== 'number') {
    throw modelAttribute.get('name').get('name').buildCodeFrameError('you can only use number modifier with <select/ >')
  }

  const number = modifier === 'number'

  const valueGetter = t.ConditionalExpression(
    t.BinaryExpression('in', t.StringLiteral('_value'), t.Identifier('o')),
    t.MemberExpression(t.Identifier('o'), t.Identifier('_value')),
    t.MemberExpression(t.Identifier('o'), t.Identifier('value'))
  )

  const selectedVal = t.CallExpression(
    t.MemberExpression(
      t.CallExpression(
        t.MemberExpression(
          t.MemberExpression(
            t.MemberExpression(t.Identifier('Array'), t.Identifier('prototype')),
            t.Identifier('filter')
          ),
          t.Identifier('call')
        ),
        [
          t.MemberExpression(
            t.MemberExpression(t.Identifier('$event'), t.Identifier('target')),
            t.Identifier('options')
          ),
          t.ArrowFunctionExpression(
            [t.Identifier('o')],
            t.MemberExpression(t.Identifier('o'), t.Identifier('selected'))
          )
        ]
      ),
      t.Identifier('map')
    ),
    [
      t.ArrowFunctionExpression(
        [t.Identifier('o')],
        number
          ? t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_n')), [valueGetter])
          : valueGetter
      )
    ]
  )

  const assignment = t.ConditionalExpression(
    t.MemberExpression(t.MemberExpression(t.Identifier('$event'), t.Identifier('target')), t.Identifier('multiple')),
    t.Identifier('$$selectedVal'),
    t.MemberExpression(t.Identifier('$$selectedVal'), t.NumericLiteral(0), true)
  )

  const code = t.VariableDeclaration('const', [t.VariableDeclarator(t.Identifier('$$selectedVal'), selectedVal)])

  return [genValue(t, model), genListener(t, 'Change', [code, genAssignmentCode(t, model, assignment)])]
}

const genCheckboxModel = (t, modelAttribute, model, modifier, path) => {
  if (modifier && modifier !== 'number') {
    throw modelAttribute
      .get('name')
      .get('name')
      .buildCodeFrameError('you can only use number modifier with input[type="checkbox"]')
  }

  let value = t.NullLiteral()
  let trueValue = t.BooleanLiteral(true)
  let falseValue = t.BooleanLiteral(false)

  path.get('attributes').forEach(path => {
    if (!path.node.name) {
      return
    }

    if (path.node.name.name === 'value') {
      value = getExpression(t, path)
      path.remove()
    } else if (path.node.name.name === 'true-value') {
      trueValue = getExpression(t, path)
      path.remove()
    } else if (path.node.name.name === 'false-value') {
      falseValue = getExpression(t, path)
      path.remove()
    }
  })

  const checkedProp = t.JSXAttribute(
    t.JSXIdentifier('checked'),
    t.JSXExpressionContainer(
      t.ConditionalExpression(
        t.CallExpression(t.MemberExpression(t.Identifier('Array'), t.Identifier('isArray')), [model]),
        t.BinaryExpression(
          '>',
          t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_i')), [model, value]),
          t.UnaryExpression('-', t.NumericLiteral(1))
        ),
        t.isBooleanLiteral(trueValue) && trueValue.value === true
          ? model
          : t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_q')), [model, trueValue])
      )
    )
  )

  const handlerProp = t.JSXAttribute(
    t.JSXIdentifier(`on${CHECKBOX_RADIO_TOKEN}`),
    t.JSXExpressionContainer(
      t.ArrowFunctionExpression(
        [t.Identifier('$event')],
        t.BlockStatement([
          t.VariableDeclaration('const', [
            t.VariableDeclarator(t.Identifier('$$a'), model),
            t.VariableDeclarator(
              t.Identifier('$$el'),
              t.MemberExpression(t.Identifier('$event'), t.Identifier('target'))
            ),
            t.VariableDeclarator(
              t.Identifier('$$c'),
              t.ConditionalExpression(
                t.MemberExpression(t.Identifier('$$el'), t.Identifier('checked')),
                trueValue,
                falseValue
              )
            )
          ]),
          t.IfStatement(
            t.CallExpression(t.MemberExpression(t.Identifier('Array'), t.Identifier('isArray')), [t.Identifier('$$a')]),
            t.BlockStatement([
              t.VariableDeclaration('const', [
                t.VariableDeclarator(
                  t.Identifier('$$v'),
                  modifier === 'number'
                    ? t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_n')), [value])
                    : value
                ),
                t.VariableDeclarator(
                  t.Identifier('$$i'),
                  t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_i')), [
                    t.Identifier('$$a'),
                    t.Identifier('$$v')
                  ])
                )
              ]),
              t.IfStatement(
                t.MemberExpression(t.Identifier('$$el'), t.Identifier('checked')),
                t.BlockStatement([
                  t.ExpressionStatement(
                    t.LogicalExpression(
                      '&&',
                      t.BinaryExpression('<', t.Identifier('$$i'), t.NumericLiteral(0)),
                      t.AssignmentExpression(
                        '=',
                        model,
                        t.CallExpression(t.MemberExpression(t.Identifier('$$a'), t.Identifier('concat')), [
                          t.Identifier('$$v')
                        ])
                      )
                    )
                  )
                ]),
                t.BlockStatement([
                  t.ExpressionStatement(
                    t.LogicalExpression(
                      '&&',
                      t.BinaryExpression('>', t.Identifier('$$i'), t.UnaryExpression('-', t.NumericLiteral(1))),
                      t.AssignmentExpression(
                        '=',
                        model,
                        t.CallExpression(
                          t.MemberExpression(
                            t.CallExpression(t.MemberExpression(t.Identifier('$$a'), t.Identifier('slice')), [
                              t.NumericLiteral(0),
                              t.Identifier('$$i')
                            ]),
                            t.Identifier('concat')
                          ),
                          [
                            t.CallExpression(t.MemberExpression(t.Identifier('$$a'), t.Identifier('slice')), [
                              t.BinaryExpression('+', t.Identifier('$$i'), t.NumericLiteral(1))
                            ])
                          ]
                        )
                      )
                    )
                  )
                ])
              )
            ]),
            t.BlockStatement([genAssignmentCode(t, model, t.Identifier('$$c'))])
          )
        ])
      )
    )
  )

  return [checkedProp, handlerProp]
}

const genRadioModel = (t, modelAttribute, model, modifier, path) => {
  if (modifier && modifier !== 'number') {
    throw modelAttribute
      .get('name')
      .get('name')
      .buildCodeFrameError('you can only use number modifier with input[type="radio"]')
  }

  let value = t.BooleanLiteral(true)

  path.get('attributes').forEach(path => {
    if (!path.node.name) {
      return
    }

    if (path.node.name.name === 'value') {
      value = getExpression(t, path)
      path.remove()
    }
  })

  const checkedProp = t.JSXAttribute(
    t.JSXIdentifier('checked'),
    t.JSXExpressionContainer(
      t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_q')), [model, value])
    )
  )

  const handlerProp = t.JSXAttribute(
    t.JSXIdentifier(`on${CHECKBOX_RADIO_TOKEN}`),
    t.JSXExpressionContainer(
      t.ArrowFunctionExpression(
        [t.Identifier('$event')],
        t.BlockStatement([
          genAssignmentCode(
            t,
            model,
            modifier === 'number'
              ? t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_n')), [value])
              : value
          )
        ])
      )
    )
  )

  return [checkedProp, handlerProp]
}

const genDefaultModel = (t, modelAttribute, model, modifier, path, type) => {
  const needCompositionGuard = modifier !== 'lazy' && type !== 'range'

  const event = modifier === 'lazy' ? 'Change' : type === 'range' ? RANGE_TOKEN : 'Input'

  let valueExpression = t.MemberExpression(
    t.MemberExpression(t.Identifier('$event'), t.Identifier('target')),
    t.Identifier('value')
  )

  if (modifier === 'trim') {
    valueExpression = t.CallExpression(t.MemberExpression(valueExpression, t.Identifier('trim')), [])
  } else if (modifier === 'number') {
    valueExpression = t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_n')), [valueExpression])
  }

  let code = genAssignmentCode(t, model, valueExpression)

  if (needCompositionGuard) {
    code = t.BlockStatement([
      t.IfStatement(
        t.MemberExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('target')), t.Identifier('composing')),
        t.ReturnStatement(null)
      ),
      code
    ])
  } else {
    code = t.BlockStatement([code])
  }

  const valueProp = t.JSXAttribute(t.JSXIdentifier('value'), t.JSXExpressionContainer(model))

  const handlerProp = t.JSXAttribute(
    t.JSXIdentifier(`on${event}`),
    t.JSXExpressionContainer(t.ArrowFunctionExpression([t.Identifier('$event')], code))
  )

  const props = [valueProp, handlerProp]

  if (modifier === 'trim' || modifier === 'number') {
    props.push(
      t.JSXAttribute(
        t.JSXIdentifier('onBlur'),
        t.JSXExpressionContainer(
          t.ArrowFunctionExpression(
            [],
            t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('$forceUpdate')), [])
          )
        )
      )
    )
  }

  return props
}

const genComponentModel = (t, modelAttribute, model, modifier, path, type) => {
  const baseValueExpression = t.Identifier('$$v')
  let valueExpression = baseValueExpression

  if (modifier === 'trim') {
    valueExpression = t.CallExpression(t.MemberExpression(valueExpression, t.Identifier('trim')), [])
  } else if (modifier === 'number') {
    valueExpression = t.CallExpression(t.MemberExpression(t.ThisExpression(), t.Identifier('_n')), [valueExpression])
  }

  const assignment = genAssignmentCode(t, model, valueExpression)

  const valueProp = t.JSXAttribute(t.JSXIdentifier('value'), t.JSXExpressionContainer(model))

  const handlerProp = t.JSXAttribute(
    t.JSXIdentifier(`onChange`),
    t.JSXExpressionContainer(t.ArrowFunctionExpression([baseValueExpression], t.BlockStatement([assignment])))
  )

  return [valueProp, handlerProp]
}

export default ({ types: t }) => {
  return {
    visitor: {
      JSXOpeningElement(path) {
        let model = null
        let modifier = null
        let modelAttribute = null
        let type = null
        let dynamicTypePath = null

        path.get('attributes').forEach(path => {
          if (!path.node.name) {
            return
          }

          if (path.node.name.name === 'type') {
            type = path.node.value.value

            if (t.isJSXExpressionContainer(path.node.value)) {
              dynamicTypePath = path.get('value')
            }
          }
          if (t.isJSXIdentifier(path.node.name)) {
            if (path.node.name.name !== 'v-model') {
              return
            }
          } else if (t.isJSXNamespacedName(path.node.name)) {
            if (path.node.name.namespace.name !== 'v-model') {
              return
            }

            if (!allowedModifiers.includes(path.node.name.name.name)) {
              throw path
                .get('name')
                .get('name')
                .buildCodeFrameError(`v-model does not support "${path.node.name.name.name}" modifier`)
            }

            modifier = path.node.name.name.name
          } else {
            return
          }

          modelAttribute = path

          if (model) {
            throw path.buildCodeFrameError('you can not have multiple v-model directives on a single element')
          }

          if (!t.isJSXExpressionContainer(path.node.value)) {
            throw path.get('value').buildCodeFrameError('you should use JSX Expression with v-model')
          }

          if (!t.isMemberExpression(path.node.value.expression)) {
            throw path
              .get('value')
              .get('expression')
              .buildCodeFrameError('you should use MemberExpression with v-model')
          }

          model = path.node.value.expression
        })

        if (!model) {
          return
        }

        const tag = path.node.name.name

        if (tag === 'input' && dynamicTypePath) {
          throw dynamicTypePath.buildCodeFrameError('you can not use dynamic type with v-model')
        }

        let replacement = null

        if (tag === 'select') {
          replacement = genSelectModel(t, modelAttribute, model, modifier)
        } else if (tag === 'input' && type === 'checkbox') {
          replacement = genCheckboxModel(t, modelAttribute, model, modifier, path)
        } else if (tag === 'input' && type === 'radio') {
          replacement = genRadioModel(t, modelAttribute, model, modifier, path)
        } else if (tag === 'input' || tag === 'textarea') {
          replacement = genDefaultModel(t, modelAttribute, model, modifier, path, type)
        } else if (!isReservedTag(tag)) {
          replacement = genComponentModel(t, modelAttribute, model, modifier, path)
        }

        modelAttribute.replaceWithMultiple(replacement)
      }
    }
  }
}
