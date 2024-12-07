//用于在IDE中测试自定义的更新函数
//title:string
//inputArray:从数据库中获取的block数组
//attrs:手动添加的属性
import { title, inputArray, attrs } from "./func/updateFunc.js";
//也可以直接粘贴input的值，用于测试单个block
import { input } from "./func/updateFunc.js";
//tools 未引入，需要使用时只能在思源中运行
import { func } from "./func/updateFunc.js";
/* 
func具有如下形式：
export const func = (inputs, output) => {
  ...
  return { inputs, output };
}; 
*/
if (input) {
  const { _input, output } = func(input, input.block.markdown);
  console.log(output);
} else {
  const inputs = inputArray.map((e, index, arr) => {
    return {
      block: e,
      extra: {
        title,
        attrs,
      },
      index: index,
      array: arr,
      isDelete: false,
    };
  });
  inputs.forEach((e) => {
    const { _input, output } = func(e, e.block.markdown);
    console.log(`第${e.index}条输出：`);
    console.log(output);
  });
}
