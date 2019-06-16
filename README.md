# eslint-plugin-sort-exports

Sort export declarations in modules, similarly to [sort-imports](https://eslint.org/docs/rules/sort-imports)

## Installation

First install [ESLint](https://www.eslint.org)

```
yarn add -d eslint
```

Then install `eslint-plugin-sort-exports`

```
yarn add --dev eslint-plugin-sort-exports
```

**Note:** If you installed ESLint globally, you must also install `eslint-plugin-sort-exports` globally.

## Usage

Add `sort-exports` to the plugins section of your `.eslintrc` and configure the rule under the `rules` section.

```
{
    "plugins": ["sort-exports"],
    "rules": {
        "sort-exports/sort-exports": ["error", ["asc"]]
    }
}
```

## Supported rules

```
sort-exports
```

## Configuration

```
{
    "sort-exports/sort-exports": [
        "error",
        "asc",
        { ignoreCase: true }
    ]
}
```

The first option can be either `asc` or `desc`

- `asc` (default): Sort exports in ascending order.
- `desc`: Sort exports in descending order.

The second option is an object with the following properties:

- `ignoreCase`: If true, sorting is case-insensitive.
