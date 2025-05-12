<template>
    <ProtyleUtil
      :files="files"
      :blockElements="blockElements"
      :protyle="protyle"
      :dialog="dialog"
      :component="component"
    />
  </template>
  
  <script lang="ts" setup>
  import ProtyleUtil from './libs/ProtyleUtil.vue';
  import { Dialog, IProtyle } from "siyuan";
  import { ISnippet, EComponent } from "./libs/constants";
  
  const files = ref<ISnippet[]>([]);
  const blockElements = ref<HTMLElement[]>([]);
  const protyle = ref<IProtyle | null>(null);
  const dialog = ref<Dialog | null>(null);
  const component = ref<EComponent>(EComponent.Copy);
  </script>