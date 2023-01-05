const noop = () => {};

export const debug = DEBUG ? console.debug : noop;

export const log = DEBUG ? console.log : noop;

export const warn = console.warn;

export const error = console.error;
