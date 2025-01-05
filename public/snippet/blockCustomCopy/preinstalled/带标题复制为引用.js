/**
 * @metadata
 * 这是一个示例脚本
 *
 * 自定义的"复制为块引用"，在内容前加上文档标题
 */


output = `((${input.block.id} '${input.extra.title}-${input.block.content}'))`;
