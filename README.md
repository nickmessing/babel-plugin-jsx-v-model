[![Build Status](https://travis-ci.org/nickmessing/babel-plugin-jsx-v-model.svg?branch=master)](https://travis-ci.org/nickmessing/babel-plugin-jsx-v-model)

## JSX v-model for Vue JSX

This babel plugin adds some syntactic sugar to JSX.

### Usage:

```bash
npm i babel-plugin-jsx-v-model -D
```

Then add `jsx-v-model` to your `.babelrc` file under `plugins`

example .babelrc:
```json
{
  "presets": ["es2015"],
  "plugins": ["jsx-v-model", "transform-vue-jsx"]
}
```

Behaviour is similar to vue template's [v-model](https://vuejs.org/v2/api/#v-model).
