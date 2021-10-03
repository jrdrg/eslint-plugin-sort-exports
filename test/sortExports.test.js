const rule = require("../lib/sortExports");

const RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
});

ruleTester.run("sort-exports/sort-exports", rule, {
  valid: [
    {
      code: "export function bar() {}; export function foo() {};",
    },
    {
      code: "export function bar() {}; export function Foo() {};",
      options: [{ sortDir: "asc", ignoreCase: true }],
    },
    {
      code: "export function foo() {}; export function bar() {};",
      options: [{ sortDir: "desc" }],
    },
    {
      code:
        "export function C() {}; export function a() {}; export function b() {};",
    },
    {
      code: "export function bar() {}; export function Foo() {};",
      options: [{ sortDir: "desc", ignoreCase: false }],
    },
    {
      code: 'export const a="123"; export const b="3";',
    },
    {
      code: 'export const a="123"; export function b() {}',
    },
    {
      code: 'export {a, b} from "foo"',
    },
    {
      code: "const a=1; const b=2; export {a, b};",
    },
    {
      code: 'export {a, b, c} from "foo"',
    },
    {
      code: 'export {a, c} from "foo"; export function b() {};',
    },
    {
      code: 'export * from "bar"; export * from "foo";',
    },
    {
      code: "export type {Bar}; export {Foo};",
    },
    {
      code: "export type {Bar}; export {Baz}; export type {Foo};",
    },
    {
      code: "export type {Bar}; export type {Foo}; export {Baz};",
      options: [{ sortExportKindFirst: "type" }],
    },
    {
      code: "export {Baz}; export type {Bar}; export type {Foo};",
      options: [{ sortExportKindFirst: "value" }],
    },
    {
      code: "export {}",
      options: [{ ignoreCase: true }],
    },
  ],

  invalid: [
    {
      code: "export function bar() {}; export function Foo() {};",
      options: [{ ignoreCase: false }],
      errors: ["Expected Foo before bar"],
    },
    {
      code:
        'export const b="1"; export function a() {}; export function c() {};',
      errors: ["Expected a before b"],
    },
    {
      code: "export function d() {}; export function c() {};",
      options: [{ sortDir: "asc" }],
      errors: ["Expected c before d"],
    },
    {
      code:
        "export function b() {}; export function d() {}; export function c() {}; export function f() {}; export function e() {};",
      errors: ["Expected c before d", "Expected e before f"],
    },
    {
      code: 'export const b="123"; export function a() {}',
      errors: ["Expected a before b"],
    },
    {
      code: 'export const b="123"; export const a="3";',
      errors: ["Expected a before b"],
    },
    {
      code: 'export {b, a} from "foo"',
      errors: ["Expected a before b"],
    },
    {
      code: 'export {a, c, b} from "foo"',
      errors: ["Expected b before c"],
    },
    {
      code: 'export * from "foo"; export * from "bar";',
      errors: ["Expected bar before foo"],
    },
    {
      code: 'export {Icon} from "./Icon"; export {Button} from "./Button";',
      errors: ["Expected Button before Icon"],
    },
    {
      code: "export type {Foo}; export {Bar};",
      errors: ["Expected Bar before Foo"],
    },
    {
      code: "export type {Foo}; export {Bar};",
      options: [{ sortExportKindFirst: "none" }],
      errors: ["Expected Bar before Foo"],
    },
    {
      code: "export type {Foo}; export type {Bar}; export {Baz};",
      options: [{ sortExportKindFirst: "type" }],
      errors: ["Expected Bar before Foo"],
    },
    {
      code: "export type {Bar}; export {Baz}; export type {Foo};",
      options: [{ sortExportKindFirst: "type" }],
      errors: ["Expected Foo before Baz"],
    },
    {
      code: "export type {Bar}; export {Baz}; export type {Foo};",
      options: [{ sortExportKindFirst: "value" }],
      errors: ["Expected Baz before Bar"],
    },
    {
      code: "export type {Bar}; export {Baz}; export type {Foo}; export {foo}",
      options: [{ sortExportKindFirst: "value" }],
      errors: ["Expected Baz before Bar", "Expected foo before Foo"],
    },
  ],
});
