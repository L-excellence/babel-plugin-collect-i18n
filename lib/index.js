const fs = require('fs');
const path = require('path');
let timer = null;

const mergePluginOptions = (options = {}) => {
  return {
    // 模式：只做收集 | 收集并匹配词条输出词条文件
    mode: options.mode === 'collect' ? 'collect' : 'generate',
    // i18n 表达式参数 key
    name: options.name ? (Array.isArray(options.name) ? options.name : [options.name]) : ['i18n'],
    // 输出路径
    output: options.output || 'src/locale/i18n.js',
    // 输出模块类型
    moduleType: options.moduleType === 'commonjs' ? 'commonjs' : 'es',
    // 与词条 key 相匹配的多语种资源所在位置
    locale: options.locale || 'i18n/index.json',
  }
}

const collectI18nKeys = (path, options, collector) => {
  const node = path.node;
  if (
    // 1、使用 i18n('xxx') 方式 （标识符）
    (node.callee.type === 'Identifier' && options.name.indexOf(node.callee.name) > -1 && node.arguments.length > 0) ||
    // 2、使用 window.i18n('xxx') 方式 （对象成员表达式）
    (node.callee.type === 'MemberExpression' && node.callee.object.name === 'window' && options.name.indexOf(node.callee.property.name) > -1 && node.arguments.length > 0)
  ) {
    const i18nKey = node.arguments[0].value;
    // console.log(node.callee.type === 'MemberExpression' ? 'MemberExpression' : 'CallExpression', i18nKey, '\n');
    if (!collector.has(i18nKey)) collector.set(i18nKey, true);
  }
}

module.exports = () => {
  const collector = new Map(), noMatchKeys = [];
  let options = null;

  return {
    pre() {
      this.collectorTotal = collector.size;
    },

    visitor: {
      // 表达式调用（收集 目标 表达式）
      CallExpression(path, state) {
        if (!options) options = mergePluginOptions(state.opts);
        collectI18nKeys(path, options, collector);
      }
    },

    post() {
      // 在文件内收集到了 i18n，输出到目录文件中
      if (this.collectorTotal !== collector.size) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const { mode, output, moduleType, locale } = options;
          const outputDirectory = path.resolve(path.dirname(output)), outputFile = path.resolve(output);

          const exportType = moduleType === 'commonjs' ? `module.exports =` : `export default`;
          const i18nKeys = Array.from(collector.keys());
          let result = {};

          if (mode === 'generate') {
            const localeContent = JSON.parse(fs.readFileSync(path.resolve(locale), 'utf8'));
            for (let i = 0; i < i18nKeys.length; i++) {
              const key = i18nKeys[i], value = localeContent[key];
              if (!value && noMatchKeys.indexOf(key) === -1) {
                noMatchKeys.push(key);
                continue;
              }
              result[key] = value;
            }
            if (noMatchKeys.length > 0) {
              console.log("\n \033[33m " + `warning: ${noMatchKeys.join(', ')} not found in locale file.` + "\033[0m \n");
            }
          } else {
            result = i18nKeys;
          }

          const content = `${exportType} ${JSON.stringify(result, null, 2)}`;

          // 确保目录存在
          try { fs.statSync(outputDirectory) }
          catch { fs.mkdirSync(outputDirectory) }
          fs.writeFileSync(outputFile, content);
        }, 300)
      }
    }
  }
};