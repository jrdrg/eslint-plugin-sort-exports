module.exports = {
  type: "suggestion",

  docs: {
    description: "Sort export declarations from modules",
    category: "ECMAScript 6",
    recommended: false,

    url: "",
  },

  schema: [
    {
      type: "object",
      properties: {
        sortDir: {
          type: "string",
          enum: ["asc", "desc"],
        },
        ignoreCase: {
          type: "boolean",
        },
      },
      additionalProperties: false,
    },
  ],

  create(context) {
    const config = context.options[0] || {};

    const { sortDir = "asc", ignoreCase = false } = config;

    let previousExport = null;

    function getIdentifier(node) {
      const { declaration } = node;
      if (declaration) {
        if (declaration.id) {
          return declaration.id.name;
        }
        if (declaration.declarations) {
          return declaration.declarations[0].id.name;
        }
      }
      // export * from "foo";
      if (node.type === "ExportAllDeclaration") {
        return node.source.value;
      }
      return "";
    }

    function getNamedExports(node) {
      const { specifiers } = node;
      if (specifiers) {
        return specifiers
          .filter(s => s.type === "ExportSpecifier")
          .map(s => s.exported.name);
      }
    }

    function isOutOfOrder(first, second) {
      if (sortDir === "desc") {
        return handleCase(first) < handleCase(second);
      }
      return handleCase(first) > handleCase(second);
    }

    function handleCase(name) {
      return ignoreCase ? name.toLowerCase() : name;
    }

    function checkDeclaration(node) {
      const identifier = getIdentifier(node);
      if (!previousExport) {
        previousExport = handleCase(identifier);
      }

      const currentExport = handleCase(identifier);

      if (!currentExport) {
        // For example, export { a, b } from 'foo'
        const namedExports = getNamedExports(node);

        let previousNamedExport = null;

        namedExports.forEach(currentNamedExport => {
          if (!previousNamedExport) {
            previousNamedExport = currentNamedExport;
          }
          if (isOutOfOrder(previousNamedExport, currentNamedExport)) {
            context.report({
              message: `Expected ${currentNamedExport} before ${previousNamedExport}`,
              node,
            });
          }

          previousNamedExport = currentNamedExport;
        });
      } else {
        if (isOutOfOrder(previousExport, currentExport)) {
          context.report({
            message: `Expected ${currentExport} before ${previousExport}`,
            node,
          });
        }
      }

      previousExport = handleCase(identifier);
    }

    return {
      ExportAllDeclaration(node) {
        checkDeclaration(node);
      },
      ExportNamedDeclaration(node) {
        checkDeclaration(node);
      },
    };
  },
};
