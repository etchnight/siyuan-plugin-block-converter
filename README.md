# 块转换工具

- ❗❗❗无论如何，使用代码片段更新块都有一定的风险，请使用多个块测试没有问题后再使用该工具进行更新，并推荐对待更新内容进行备份。
- 🚀 实验性功能基本上都使用了一些未公开的 API，所以可能存在不稳定的情况，请谨慎使用。
- ❗0.4.0版本开始，插件不再支持旧版本的代码片段，以支持更多功能，请阅读说明。

[English](./README_en_US.md)

[更新日志](./CHANGELOG.md)

## 简介

使用自定义代码进行复制、粘贴和更新操作，以块为单位进行操作，目前包含以下组件：

- 自定义块粘贴：将剪贴板内 html 粘贴至思源笔记，支持自定义转化为 Markdown 规则，针对表格做了优化。
- 自定义块复制：复制块时将把块内容按指定方法处理后再写入剪贴板。
- 自定义块更新：使用自定义代码处理块内容并更新。

## 使用方法

### 使用预设代码片段

插件预设了部分代码片段，可以直接使用。点击要 粘贴/复制/更新 的 块/文件 的块标 -> 插件 -> 自定义复制/粘贴/更新，选择要使用的 js 代码。（🚀 对文件使用为实验性功能）

❗插件每次加载时会覆盖`preinstalled`文件夹，如需定制（修改），请复制一个副本。

目前已预设的代码片段：

- 自定义块粘贴
- 自定义块复制
- 自定义块更新
  - 中文排版综合：空格替换、西文字符替换为中文字符、在中文和英文之间增加空格
  - 文档所有标题降级：思源仅内置标题下降级功能，此插件为文档所有标题降级
  - 列表转mermaid流程图

### 自行编写代码片段

1. 在插件设置中设置 js 代码所在文档，在上述文档中编写 js 代码，代码片段是函数的主体部分
   - 必须使用代码块，并明确表示是 js 代码
   - 可以给块设置“命名”以方便区分，也可以添加备注以作为描述文字
2. 也可以直接在`data\storage\petal\siyuan-plugin-block-converter`相应的`blockCustomCopy`/`blockCustomUpdate`/`CustomPaste`中新建js文件并编写代码
   - 不同组件的要求不尽相同，请查看组件说明
   - 可以添加以`@metadata`开头的 jsDoc 风格注释，插件会自动提取注释内容作为描述
3. 点击要 粘贴/复制/更新 的 块/文件 的块标 -> 插件 -> 自定义复制/粘贴/更新，选择要使用的 js 代码
   - 🚀 对文件使用为实验性功能

## 自定义块粘贴

将剪贴板内 html 粘贴至思源笔记，使用[mixmark-io/turndown: 🛏 An HTML to Markdown converter written in JavaScript (github.com)](https://github.com/mixmark-io/turndown)而不是 Lute 作为 html 转 markdown 工具。

js 代码片段应该具有如下形式，关于 filter 和 replacement 的详细描述，参见[turndown 文档](https://github.com/mixmark-io/turndown)。

- filter：过滤条件，返回 true 表示该节点需要处理，返回 false 表示该节点不需要处理
- replacement：替换方法，返回值将作为该节点的 markdown 内容
- 参数：content，该节点的 html 内容；node，该节点；options，turndown 的 options
- ⚠️v1.0.0版本开始，需要写成数组形式，不再对自定义粘贴执行全部规则，而是只执行数组中的规则
- 该组件中有一个全部生效的预设规则，用于将html表格转化为思源表格

```js
[
  {
    filter: function (node, options) {
      const fontSize = node.style.fontSize;
      const fontSizeNum = parseInt(fontSize);
      return fontSizeNum >= 22;
    },
    replacement: function (content, node, options) {
      return "# " + content;
    },
  },
];
```

## 自定义块复制

在思源中编写 js 代码，复制块时将把块内容按指定方法处理后再写入剪贴板。

### 函数相关

#### 参数与返回值

函数的入参和返回值一致，具体如下：

```ts
/**
 * 自定义函数输入参数1 : input，选择的块信息
 */
interface IInput {
  block: Block; //当前块，见 用户指南/请从这里开始/搜索进阶/数据库表
  extra: {
    title: string; //当前文档标题
    attrs: { [key: string]: string }; //当前块属性
  };
  index: number; //当前块索引
  array: Block[]; //选择的所有块
  isDelete: boolean; //是否删除，在自定义更新中使用，表示是否删除当前块，默认为false
  isIgnore: boolean; //是否忽略，在自定义更新中使用，true 表示不进行任何操作，比output原样输出安全，优先于isDelete，默认为false
}

/**
 * 自定义函数输入参数2: tools，工具函数，提供的函数见下文
 */
interface ITools {
  [key: string]: any;
}
/**
 * 自定义函数输入参数3: output，输出，默认为原块的Markdown内容
 */
type IOutput = string; //Markdown文本
```

#### 调用其他 js 代码片段

```js
async function executeFunc(
  input: IFuncInput,
  tools: ITools,
  output: string,
  jsBlock: {
    isFile: boolean;//是否为文件
    label: string;//显示名称
    snippet?: string;//代码片段内容
    path?: string; //file专属，注意，该路径是相对于"/data/storage/petal/siyuan-plugin-block-converter/"的路径
    id?: string; //Block块专属，拟调用的js块id
    name?: string; //Block块专属，拟调用的js块命名
    description?: string;//描述
}): Promise<{
    input: IFuncInput;
    tools: ITools;
    output: string;
}>
```

通常情况下，jsBlock只需要传入path/id/name即可，插件会自动查找对应的js块，并执行其中的代码片段，它们的使用顺序为: id -> name -> path

#### tools 上提供的函数

- lute，注意与`window.Lute`不同，为编辑器内使用的 Lute 实例（而非 Lute 类,不需要调用 Lute.New()），具体使用方法参见[思源社区文档](https://docs.siyuan-note.club/zh-Hans/reference/api/plugin/class/Lute.html)。
- [prettier](https://prettier.io/):代码格式化工具，为了在编辑器中使用，使用方法与官方文档稍有不同，如：
  ```js
  await tools.prettier.prettier.format("foo();", {
    parser: "babel",
    plugins: [
      tools.prettier.prettierPluginBabel,
      tools.prettier.prettierPluginEstree,
    ],
  });
  ```
- executeFunc，调用其他js代码片段，详见上文
- siyuanApi，对思源内核api的封装，目前并不完善

### 其他特性

- 支持设置自定义快捷键（v0.2.6）
- 函数为异步方法，支持`await`
- 超时时间 5s，超时后立即返回错误不再执行

## 自定义块更新

在思源中编写 js 代码，使用该代码处理块内容并更新。

> ❗ 无论如何，使用代码片段更新块都有一定的风险，请使用多个块测试没有问题后再使用该工具进行更新，并推荐对待更新内容进行备份。
>
> ❗ 函数内容可访问全局变量，请注意风险。

### 使用方法

基本同[自定义块复制](#自定义块复制)，有以下不同：

- `input.extra.attr` 表示更新后的属性
- 返回`input.isDelete`为 `true` 时，则会删除该块
  ~~- 注意，由于`output`有内容才会对块进行处理，所以，若要删除该块，需要返回`output`不为空~~
  - 所选块的第一个块不能被删除

### ⚠️ 注意事项

- 可以将一个块更新为多个块（如返回的Markdown内容有多个段落），但只有第一个块会继承或更新属性
- v0.2.4 以上版本：新增 `inputArray` 变量(详见 自定义块复制 部分)，可以利用其将多个块更新为一个块，但是如果任何块返回 `output` 内容为空，为保证数据安全，不会主动将其清空
- v0.2.6 以上版本：支持`Ctrl+Z`撤销(🚀 实验性)
