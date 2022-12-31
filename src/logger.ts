const noop = () => {}

export const debug = DEBUG ? console.debug : noop;

export const log = DEBUG ? console.log : noop;

export const warn = DEBUG ? console.warn : noop;

export const error = DEBUG ? console.error : noop;
