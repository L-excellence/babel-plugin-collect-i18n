# babel-plugin-collect-i18n

i18n CallExpression collect plugin of babel.

## Usage
```bash
npm install babel-plugin-collect-i18n --save-dev
```

Via `.babelrc` or babel-loader.

```js
{
  "plugins": [["collect-i18n", {
    mode: 'generate',
    name: 'i18n',
    output: 'src/locale/i18n.ts',
    "moduleType": 'es',
    locale: '../../i18n/index.json',
  }]]
}
```

## Options
- mode: 模式，可选值有 generate（生成）和 `collect（收集），默认 generate；
- name: 表达式名称，比如这里的 i18n，当要匹配多个表达式时，可以传递数组，如：['i18n', 'i19n']；
- output: 输出路径，收集或生成后存放路径，默认存放在 src/locale/i18n.js 文件下；
- moduleType: 输出模块类型，可选值有 commonjs 和 es，默认为 es；
- locale: 数据池所在位置，JSON 文件格式，当 mode = generate 时会用到，默认查找 i18n/index.json 文件；

## i18n CallExpression
```tsx
function Button() {
  return (
    <button>{i18n('save')}</button>
  )
}
```

## Output
```js
// src/locale/i18n.js
export default {
  "save": {
    "zh-cn": "保存",
    "en": "Save"
  }
}
```