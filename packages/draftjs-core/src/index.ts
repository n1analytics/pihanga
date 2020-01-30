

import { PiRegister } from '@pihanga/core';
import { init as editorInit } from './editor';

export * from './editor';

export const init = (register: PiRegister) => {
  editorInit(register);
};