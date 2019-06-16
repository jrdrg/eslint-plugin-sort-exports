const rule = require("../lib/sortExports");

const RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({
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
      code: 'export {a} from "foo"; export function b() {};',
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
        "export function b() {}; export function d() {}; export function c() {};",
      errors: ["Expected c before d"],
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
  ],
});
