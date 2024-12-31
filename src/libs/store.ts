export const store = {
  waitting: false,//* 当思源正在操作数据库时，禁止用户操作
};

export const switchWait = (bool: boolean) => {
  store.waitting = bool;
  //console.log(store.waitting);
  return store.waitting;
};
