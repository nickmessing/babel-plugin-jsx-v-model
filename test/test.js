import test from 'ava'
import { transform } from 'babel-core'

const transpile = src => {
  return transform(src, {
    plugins: './index'
  }).code.trim()
}

test('input[type="radio"] with no value', t => {
  t.is(
    transpile(`
      <input
        type="radio"
        v-model={this.radio1}
      />
    `),
    `var _this = this;

<input type="radio" domPropsChecked={_this.radio1 === undefined} onChange={e => e.target.checked && (_this.radio1 = e.target.value)} />;`
  )
})

test('input[type="radio"] with string value', t => {
  t.is(
    transpile(`
      <input
        type="radio"
        v-model={this.radio1}
        value="str"
      />
    `),
    `var _this = this;

<input type="radio" domPropsChecked={_this.radio1 === "str"} onChange={e => e.target.checked && (_this.radio1 = e.target.value)} value="str" />;`
  )
})

test('input[type="radio"] with expression value', t => {
  t.is(
    transpile(`
      <input
        type="radio"
        v-model={this.radio1}
        value={this.val}
      />
    `),
    `var _this = this;

<input type="radio" domPropsChecked={_this.radio1 === this.val} onChange={e => e.target.checked && (_this.radio1 = e.target.value)} value={this.val} />;`
  )
})

test('input[type="checkbox"]', t => {
  t.is(
    transpile(`
      <input
        type="checkbox"
        v-model={this.checkbox}
      />
    `),
    `var _this = this;

<input type="checkbox" domPropsChecked={_this.checkbox} onChange={e => _this.checkbox = e.target.checked} />;`
  )
})

test('generic v-model', t => {
  t.is(
    transpile(`
      <input
        v-model={this.input}
      />
    `),
    `var _this = this;

<input domPropsValue={_this.input} onInput={e => _this.input = e.target.value} />;`
  )
})
