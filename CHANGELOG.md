## [1.1.3](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v1.1.2...v1.1.3) (2025-02-28)


### Bug Fixes

* 修复重新运行、正式运行 ([d1c1811](https://github.com/etchnight/siyuan-plugin-table-importer/commit/d1c18116f9a9e7718593ea85ee3e16354d4f6892))
* 优化表格脚本 ([6842c02](https://github.com/etchnight/siyuan-plugin-table-importer/commit/6842c022b11f03c14ac49ef11edab5ac365ca501))
* 优化描述显示 ([0bdf025](https://github.com/etchnight/siyuan-plugin-table-importer/commit/0bdf0250578eb8be6638ef5955316f8dc6e50d02))
* 优化预设脚本覆盖 ([48e0089](https://github.com/etchnight/siyuan-plugin-table-importer/commit/48e00894ca924fdea20c5839abda69d09bd46edc))
* 优化注释显示 ([8e09937](https://github.com/etchnight/siyuan-plugin-table-importer/commit/8e09937046a8796e8306a8a76131c41baba89299))


### Features

* 保存自定义脚本参数 ([3aadb28](https://github.com/etchnight/siyuan-plugin-table-importer/commit/3aadb284d5e5b45087087adba6900f9f9bfdbaa4))
* 恢复默认参数 ([edb2745](https://github.com/etchnight/siyuan-plugin-table-importer/commit/edb274549ddf7949dddf625c166629f39c69aa67))
* 增加turndown type ([946df5a](https://github.com/etchnight/siyuan-plugin-table-importer/commit/946df5ae63d1953aba869ea1fae59b2300b56ec1))
* **protyle-util:** 结果/原文切换 ([9345294](https://github.com/etchnight/siyuan-plugin-table-importer/commit/93452949c4d2f3e6d9d895fa5eecf5f9b7a34069))



## [1.1.2](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v1.1.1...v1.1.2) (2025-01-10)


### Bug Fixes

* 无注释解析错误，语句中有return语句执行错误 ([1af2a4d](https://github.com/etchnight/siyuan-plugin-table-importer/commit/1af2a4da93cf010726f37ea5091c613bc9240fdc))


### Features

* 添加lute类型，添加新预设脚本 vuePress链接转思源链接 ([8707229](https://github.com/etchnight/siyuan-plugin-table-importer/commit/87072290f927435ce6fe561b4d8562bf13edf797))
* 运行前可以改变参数 ([c8e3876](https://github.com/etchnight/siyuan-plugin-table-importer/commit/c8e387657ac1c585e0c75e10034915f9bb8f69c7))



## [1.1.1](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v1.1.0...v1.1.1) (2025-01-09)


### Bug Fixes

* 脚本名重复时（即使不属于同一个组件），设置快捷键会出现两个脚本共用一个快捷键错误 ([2aaf94d](https://github.com/etchnight/siyuan-plugin-table-importer/commit/2aaf94d52bb7701ccceaa8ea44c616542418e371))
* 使用命令面板时无法获取选中的块和protyle ([adea692](https://github.com/etchnight/siyuan-plugin-table-importer/commit/adea692f164638799903cf8fdf1662d3938dac57)), closes [#11](https://github.com/etchnight/siyuan-plugin-table-importer/issues/11)
* 修复问题：未加载和更新预设代码片段 ([3594976](https://github.com/etchnight/siyuan-plugin-table-importer/commit/35949763f65096c2b52a6147389ae7eaa33c7e74))
* **自定义粘贴:** 预设脚本 表格 ，如果第一行有行列合并时生成的表格不正确 ([3a922b8](https://github.com/etchnight/siyuan-plugin-table-importer/commit/3a922b89b43d1526a988929259e08cf59894606e))



# [1.1.0](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v1.0.2...v1.1.0) (2025-01-07)


### Bug Fixes

* 编辑器显示超出窗口高度 ([0bf29eb](https://github.com/etchnight/siyuan-plugin-table-importer/commit/0bf29eb47f9a619b669277811e44eb780206d588))
* 修复路径引用改变带来的问题 ([6954bfd](https://github.com/etchnight/siyuan-plugin-table-importer/commit/6954bfd748739eb13d908d55bb9d23bb931c41ed))
* **自定义更新:** 修复已完成数量显示错误 ([f4f65e4](https://github.com/etchnight/siyuan-plugin-table-importer/commit/f4f65e4dee3270a3f8b72b8f17fb62bad0aa9bd6))
* typescript type文件和tsconfig文件会被复制到storage文件夹 ([828a00c](https://github.com/etchnight/siyuan-plugin-table-importer/commit/828a00c7b43969299067967814c07e2d8ade0927))


### Features

* 将表格粘贴作为自定义脚本预设 ([1bce11e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/1bce11ead9321b4cccb05db912223295a2bea861))
* 清理preinstall文件夹中的其他文件 ([0db84c5](https://github.com/etchnight/siyuan-plugin-table-importer/commit/0db84c5d34d4b52c5403547cc6816a7c907b3300))
* 支持typescript ([e091727](https://github.com/etchnight/siyuan-plugin-table-importer/commit/e091727cc89f31226739558b1abf8b813c236048)), closes [#9](https://github.com/etchnight/siyuan-plugin-table-importer/issues/9)
* **自定义粘贴:** 支持覆盖原内容和多段落粘贴到各块下方 ([7bd0599](https://github.com/etchnight/siyuan-plugin-table-importer/commit/7bd0599fbce4a6ab712b2cf838bb23831d0e2dd8))


### BREAKING CHANGES

* **自定义粘贴:** 自定义粘贴脚本内容发生了较大改变，现在是标准js程序



## [1.0.2](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v1.0.1...v1.0.2) (2025-01-05)


### Bug Fixes

* **自定义粘贴:** 修复问题：如果文件中array不位于文件第一行，无法获取的规则 ([5ab1e6e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/5ab1e6e3059af4ee87da35a1dfeac860d521dcec))


### Features

* 新增脚本 文档所有标题降级、列表转mermaid流程图；现在预览可以渲染流程图等 ([b1df0da](https://github.com/etchnight/siyuan-plugin-table-importer/commit/b1df0dac00cb902028a39a5bfe3626ebe8b85d0f))
* 支持设置预览块数量限制 ([868913a](https://github.com/etchnight/siyuan-plugin-table-importer/commit/868913a64fb8c2c04e51f71b2401abfe2fe13f7e))
* **自定义复制:** 增加示例 ([705d870](https://github.com/etchnight/siyuan-plugin-table-importer/commit/705d8701c27fc5568872e0bcc3d4eb3d9ecb8d35))
* dialog 出现时重算尺寸 ([0baf7dd](https://github.com/etchnight/siyuan-plugin-table-importer/commit/0baf7dd19a74ee73afbcd52eacc2ae0f382b8b5d))



## [1.0.1](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v1.0.0...v1.0.1) (2025-01-01)


### Bug Fixes

* 预设脚本全部放在preinstalled文件夹下 ([2c1a76f](https://github.com/etchnight/siyuan-plugin-table-importer/commit/2c1a76f4a916ec659e82176851fc4ff17c66d55a))
* 执行其他文件错误提示优化 ([da9d74e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/da9d74e092a89bd34262c62219a677baf5820918))


### Features

* 加载插件时载入预存脚本 ([48cba18](https://github.com/etchnight/siyuan-plugin-table-importer/commit/48cba18e37694409777d6640611c96b6979b07b7))
* 语言国际化 ([92d34e8](https://github.com/etchnight/siyuan-plugin-table-importer/commit/92d34e8ca3f3f92654cf3b69d29e6ff7d0744d83))
* 增加预设脚本示例、中文排版综合 ([d552bac](https://github.com/etchnight/siyuan-plugin-table-importer/commit/d552bacc57ac8ae6f75f1d367c64b8f5340eba40))
* **自定义更新:** 可以跳过某些块的处理 ([ecb6439](https://github.com/etchnight/siyuan-plugin-table-importer/commit/ecb64392fb2e95821290d2049e9b0196e9b0a283))
* tools增加siyuanApi ([5e23087](https://github.com/etchnight/siyuan-plugin-table-importer/commit/5e230870a13ea72d5decafb03ce37822100eceb6))



# [1.0.0](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.4.1...v1.0.0) (2025-01-01)


### Bug Fixes

* 修复 protyleUtil 列表项多时不能自动出现滚动条 ([0143e19](https://github.com/etchnight/siyuan-plugin-table-importer/commit/0143e19424214fcb3b3dc542e73214fbb0878630))


### Features

* 显示描述文本 ([5e23265](https://github.com/etchnight/siyuan-plugin-table-importer/commit/5e2326545e86a1218c0633f042a9769b8c569be7))
* 新增 保存为代码片段 功能 ([a42fd72](https://github.com/etchnight/siyuan-plugin-table-importer/commit/a42fd72aa92b259c7d0fc39e6e1dffd225a0c3d0))
* 预览功能 ([398a1f3](https://github.com/etchnight/siyuan-plugin-table-importer/commit/398a1f34d847d7282411f23c9e027d0c178d6d7a))
* **自定义复制:** 增加使用js脚本文件功能 ([0ffabbe](https://github.com/etchnight/siyuan-plugin-table-importer/commit/0ffabbea07235c8d44eeeb34ff70401e7d4ef74a))
* **自定义更新:** 增加使用js脚本文件功能 ([96100b7](https://github.com/etchnight/siyuan-plugin-table-importer/commit/96100b76d21d35146f9dc155184d44335656f15e))
* **自定义粘贴:** 可预览结果，可自选规则 ([c7dbe1e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/c7dbe1e318ed4fb0bfebb66252ca718d7cc93310))



## [0.4.1](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.4.0...v0.4.1) (2024-12-07)


### Features

* 附加工具库prettier ([acc3e49](https://github.com/etchnight/siyuan-plugin-table-importer/commit/acc3e493722d13b694b118899250f15842024864))
* 优化报错机制 ([9126edb](https://github.com/etchnight/siyuan-plugin-table-importer/commit/9126edbc445f0efdaf9c81df7d79c8ebd80f7e6c))
* **自定义块更新:** 可以点击文档标题处的块标->插件->自定义更新，这样会更新整个文档(🚀 实验性) ([3cc3626](https://github.com/etchnight/siyuan-plugin-table-importer/commit/3cc3626e4ea3e100e37c2ab8fc52caead0f81a01))



# [0.4.0](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.3.0...v0.4.0) (2024-12-05)


### Bug Fixes

* 修复脚本热更新 ([ecd076e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/ecd076e8ba532dc4e5be495559a6eae6a3a778b2))
* **自定义块粘贴:** 修复 不进行插入粘贴的内容 的问题 ([357d861](https://github.com/etchnight/siyuan-plugin-table-importer/commit/357d8611a29fcd59f9b12f1d3dafa9e3b02b2bea)), closes [#7](https://github.com/etchnight/siyuan-plugin-table-importer/issues/7)


### Code Refactoring

* 开始重构 ([1e9e1e8](https://github.com/etchnight/siyuan-plugin-table-importer/commit/1e9e1e810fb764a7731c87d1876a20080ffcec8d))
* 重构完成 ([21eae7d](https://github.com/etchnight/siyuan-plugin-table-importer/commit/21eae7db001b8bfa38e1135f712b321c555319b0))


### Features

* 超时（5秒）自动刷新页面，以防止死循环出现 ([7d3cefb](https://github.com/etchnight/siyuan-plugin-table-importer/commit/7d3cefb3782db321b0f448772c545c33f91f7ec9)), closes [#6](https://github.com/etchnight/siyuan-plugin-table-importer/issues/6)
* 获取到的js块将按照字母顺序排序 ([dfa58fe](https://github.com/etchnight/siyuan-plugin-table-importer/commit/dfa58fe09936556556a4c270316e7fa8ea88f571))
* 可以调用另外一个代码片段 ([8569d98](https://github.com/etchnight/siyuan-plugin-table-importer/commit/8569d98191f37a5a848b3ff576b10afc6f06f6f3))
* **自定义块更新:** 提示显示运行块的名称 ([5958771](https://github.com/etchnight/siyuan-plugin-table-importer/commit/5958771b14ff8f48ce9f14e81cec4ce80f83bbc6))
* **自定义块更新:** 支持删除块 ([519842c](https://github.com/etchnight/siyuan-plugin-table-importer/commit/519842c33a67c73105c5b86ad2c1b3f138ecd949))


### BREAKING CHANGES

* 自定义函数的参数和返回值都做了较大的更改
* 暂时不可用



# [0.3.0](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.9...v0.3.0) (2024-06-02)


### Bug Fixes

* **自定义块粘贴:** 修复大量粘贴时有时获取不到插入块的id问题 ([9ca24f7](https://github.com/etchnight/siyuan-plugin-table-importer/commit/9ca24f75a5fac8b9e48e0f0d7b39bf95abc2be62))


### Code Refactoring

* 大面积重构 ([62b86c1](https://github.com/etchnight/siyuan-plugin-table-importer/commit/62b86c15d53cad4c0364c048725837202485453d))


### Features

* **自定义块粘贴:** 支持自定义转换方法 ([9cee6c2](https://github.com/etchnight/siyuan-plugin-table-importer/commit/9cee6c2a087135be5c08ca87efdba6f9516ada96))


### Performance Improvements

* **自定义块粘贴:** 改进粘贴效率 ([3ea5fd3](https://github.com/etchnight/siyuan-plugin-table-importer/commit/3ea5fd3937a8c301161f8b32b78ea7220543dd5b))


### BREAKING CHANGES

* 删除 表格插入助手 和 粘贴为 Html 块



## [0.2.9](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.8...v0.2.9) (2024-05-27)


### Bug Fixes

* **自定义块更新:** 等待块后端更新完毕后再执行 自定义 脚本 ([6684349](https://github.com/etchnight/siyuan-plugin-table-importer/commit/6684349e6dd24e36c3dca3094f51b3afbddb3300))


### Features

* **自定义块复制/自定义块粘贴:** 函数内`Lute`与`window.Lute`不同，为编辑器内使用的Lute实例（而非Lute类,不需要调用Lute.New()） ([380fe31](https://github.com/etchnight/siyuan-plugin-table-importer/commit/380fe31b63e557fbe8ccf3bbff0fca124b8feb22))


### BREAKING CHANGES

* **自定义块复制/自定义块粘贴:** 在函数内内置Lute，函数内`Lute`与`window.Lute`不同，为编辑器内使用的Lute实例（而非Lute类,不需要调用Lute.New()）



## [0.2.8](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.7...v0.2.8) (2024-05-19)


### Bug Fixes

* **自定义块粘贴:** 修正 表格交互不正确 ([2a8050c](https://github.com/etchnight/siyuan-plugin-table-importer/commit/2a8050cdea7df8e5e79d6d095b87523854b080fc))
* **自定义块粘贴:** 优化表格宽度 ([563a5e3](https://github.com/etchnight/siyuan-plugin-table-importer/commit/563a5e399696fd1b47e14fada354ee6eca05780f))


### Features

* **自定义块复制/自定义块更新:** 未选中块时，将光标所在块视为选中的块 ([296319e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/296319e6affa480b2e9efd62cd5b77a31351fbfe))
* **自定义块粘贴:** 新模块，整合 表格插入助手 和 粘贴为 Html 块 ([83eaafc](https://github.com/etchnight/siyuan-plugin-table-importer/commit/83eaafcd465ab384bb36c204c4d7d5dbf7785fb2)), closes [#5](https://github.com/etchnight/siyuan-plugin-table-importer/issues/5)



## [0.2.7](https://github.com/etchnight/siyuan-plugin-table-importer/compare/v0.2.6...v0.2.7) (2024-05-12)


### Bug Fixes

* **自定义块更新:** 修复undo时更新块不正确问题 ([1eff47e](https://github.com/etchnight/siyuan-plugin-table-importer/commit/1eff47e32588a9ae342e9d4e70f9807a8db0df9e))


### Features

* **自定义块更新、自定义块复制:** 支持异步 ([6b322f3](https://github.com/etchnight/siyuan-plugin-table-importer/commit/6b322f30dbe0450ae26cb698c03dff9a5e06862c))



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
