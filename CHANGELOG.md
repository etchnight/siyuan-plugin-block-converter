## [0.2.6](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.5...v0.2.6) (2024-05-02)


### Bug Fixes

* **粘贴为 html 块:** 更新buildBlock ([06d5cda](https://github.com/etchnight/siyuan-plugin-table-importer/commit/06d5cda6963546efddd61d35e650690ded67c940))


### Features

* **自定义块复制、自定义块更新:** 支持自定义快捷键 ([a41dd1f](https://github.com/etchnight/siyuan-plugin-table-importer/commit/a41dd1f62029b471ce6da8a1bf53fa9f9cda2b18))
* **自定义块更新:** 支持撤销 ([d61f0a9](https://github.com/etchnight/siyuan-plugin-table-importer/commit/d61f0a9191d047a8ea2d58fb0b7b44100d01132e))



## [0.2.5](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.4...v0.2.5) (2024-04-28)

### Features

- **粘贴为 HTML 块:** 新增 粘贴为 html 块功能 ([ba099f4d](https://github.com/etchnight/siyuan-plugin-table-importer/commit/ba099f4dd06d43164d443a5f3646813432b26d7c))

### Bug Fixes

- **自定义块复制、自定义块更新:** 修正 JavaScript 代码块判断([dbec8663](https://github.com/etchnight/siyuan-plugin-table-importer/commit/dbec8663ea3a8343b5ccefae114d176ec235b37a))

## [0.2.4](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.3...v0.2.4) (2024-04-17)

### Features

- **自定义块复制,自定义块更新:** 自定义函数新增 inputArray 变量 ([94e6134](https://github.com/etchnight/siyuan-plugin-table-importer/commit/94e6134ac028f7fea1eaf109adde2a83cfbd4ccd))
- **自定义块复制/自定义块更新:** 支持已有脚本热更新 ([3d19b8c](https://github.com/etchnight/siyuan-plugin-table-importer/commit/3d19b8cf8990e9148cbc4772da78627475be3c98))

## [0.2.3](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.2...v0.2.3) (2024-04-04)

### Bug Fixes

- **表格插入助手:** 修复丢失单元格纯文字节点问题 ([e7b8da9](https://github.com/etchnight/siyuan-plugin-table-importer/commit/e7b8da9ef3f91b0b99161a306af48259128691ba))

### Features

- 增加设置 ([5fc2c16](https://github.com/etchnight/siyuan-plugin-table-importer/commit/5fc2c163e92216e513af0bd5064f4a482cdd5eb4))

## [0.2.2](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.1...v0.2.2) (2024-04-01)

### Bug Fixes

- **自定义块更新:** 更新块时保留块属性 ([f7d9acb](https://github.com/etchnight/siyuan-plugin-table-importer/commit/f7d9acb4011d91ba0bd7a9e4ed8d4071b2d82675))
- **自定义块更新:** 修复引用、上标等不能正常转换问题 ([84faeeb](https://github.com/etchnight/siyuan-plugin-table-importer/commit/84faeeb9586217316e2e8d05b41597751ec1aa27))

### Features

- **自定义块更新:** 可以更新属性 ([860dc8c](https://github.com/etchnight/siyuan-plugin-table-importer/commit/860dc8c502b4b46521ecd97ed6f11fed05163b35))

### Reverts

- **流程图生成器:** 移除 流程图生成器 ([8b84e17](https://github.com/etchnight/siyuan-plugin-table-importer/commit/8b84e170ab7d246be60324a78c241fb0e2fadfea))

### BREAKING CHANGES

- **流程图生成器:** 移除插件中 block2flowchart
- **自定义块更新:** 之前 js return 值为 markdown 文本

## [0.2.1](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.0...v0.2.1) (2024-03-22)

### Features

- **自定义块更新:** 新增 自定义块更新 工具 ([b1d4bb9](https://github.com/etchnight/siyuan-plugin-table-importer/commit/b1d4bb9f6f6963b4a0057146f20635d9dabd0a0c))

# [0.2.0](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.1.3...v0.2.0) (2024-03-17)

### Features

- **自定义块复制:** 增加块自定义复制功能 ([96e13ca](https://github.com/etchnight/siyuan-plugin-table-importer/commit/96e13ca959954cba5c46db062a4126f414e420be))
- **自定义块复制:** 增加设置 js 块所在文档功能 ([b33b19b](https://github.com/etchnight/siyuan-plugin-table-importer/commit/b33b19babeeef6ac1241733569c8b009f2afed94))

## [0.1.3](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.1.2...v0.1.3) (2024-03-09)

### Bug Fixes

- **流程图生成器:** 改进引用标识文本搜寻 ([93ebca9](https://github.com/etchnight/siyuan-plugin-table-importer/commit/93ebca908fe891a972342397993fc3f17bbb296c))

### Features

- **流程图生成器:** subgraph 支持 ([4464e9c](https://github.com/etchnight/siyuan-plugin-table-importer/commit/4464e9cc0c066b3739527f7493fde0b87b6e8c3d)), closes [#1](https://github.com/etchnight/siyuan-plugin-table-importer/issues/1)

## [0.1.2](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.1.1...v0.1.2) (2024-03-08)

### Bug Fixes

- **流程图生成器:** 修复非 event 节点线上文字不显示、无 markdown 内容节点显示错误 ([564d3f9](https://github.com/etchnight/siyuan-plugin-table-importer/commit/564d3f987ba01a236965c48cff95985c5058b5ec))

### Features

- **流程图生成器:** 支持在一个链接中创建一组节点和线 ([d223b1e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/d223b1e3ad2a6a1e181ce766e0eed9094dcd91f4))

## [0.1.1](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.1.0...v0.1.1) (2024-03-08)

### Bug Fixes

- **流程图生成器:** 修复列表项无法生成的问题 ([5bfec35](https://github.com/etchnight/siyuan-plugin-table-importer/commit/5bfec35cfedf2ec7fb8cb8d6707d069449839ade))

### Features

- **流程图生成器:** 流程图 event 关键字 ([03014fe](https://github.com/etchnight/siyuan-plugin-table-importer/commit/03014fe0a27185069b14dd2d3fc3052beda12280)), closes [#2](https://github.com/etchnight/siyuan-plugin-table-importer/issues/2)
- **流程图生成器:** 支持反向箭头 ([9cce0d6](https://github.com/etchnight/siyuan-plugin-table-importer/commit/9cce0d650147d0033ca1a04eabb842d8ce820ff5)), closes [#3](https://github.com/etchnight/siyuan-plugin-table-importer/issues/1)
- **流程图生成器:** 支持自定义节点显示名称 ([d045e9a](https://github.com/etchnight/siyuan-plugin-table-importer/commit/d045e9a711fe8664a19f2815d2916eff050e3e53)), closes [#4](https://github.com/etchnight/siyuan-plugin-table-importer/issues/4)

# [0.1.0](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.0.1...v0.1.0) (2024-02-20)

### Features

- 生成流程图 ([ad12d3b](https://github.com/etchnight/siyuan-plugin-table-importer/commit/ad12d3bc5a7e1bdbbceef5cdc99da7955d1c2e20))

## 0.0.1

### Features

- 表格插入助手
