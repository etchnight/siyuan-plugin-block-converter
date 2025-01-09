import { IProtyle } from "siyuan";

export const store = {
  waitting: false, //* 当思源正在操作数据库时，禁止用户操作
  previewLimit: 10, //* 预览条数限制
  protyle: null as IProtyle, //* 当前正在使用的 Protyle，用于在全局是
};

export const switchWait = (bool: boolean) => {
  store.waitting = bool;
  //console.log(store.waitting);
  return store.waitting;
};

export const switchPreviewLimit = (num: number) => {
  store.previewLimit = num;
  return store.previewLimit;
};

export const switchProtyle = ({
  detail,
}: {
  detail: { protyle: IProtyle };
}) => {
  store.protyle = detail.protyle;
  return store.protyle;
};
