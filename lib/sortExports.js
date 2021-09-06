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
        sortExportKindFirst: {
          type: "string",
          enum: ["type", "value", "none"],
        },
      },
      additionalProperties: false,
    },
  ],

  create(context) {
    const config = context.options[0] || {};

    const {
      sortDir = "asc",
      ignoreCase = false,
      sortExportKindFirst = "none",
    } = config;

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

    function getExportKind(node) {
      return node.exportKind;
    }

    function getNamedExports(node) {
      const { specifiers } = node;
      if (specifiers) {
        return specifiers
          .filter((s) => s.type === "ExportSpecifier")
          .map((s) => s.exported.name);
      }
    }

    function isOutOfOrder(first, second) {
      if (sortDir === "desc") {
        return handleCase(first) < handleCase(second);
      }
      return handleCase(first) > handleCase(second);
    }

    function isSameKind(first, second) {
      if (sortExportKindFirst !== "none") {
        return first.kind === second.kind;
      }
      return true;
    }

    function isKindOutOfOrder(first, second) {
      if (sortExportKindFirst === "value") {
        return first < second;
      } else if (sortExportKindFirst === "type") {
        return first > second;
      }
      return false;
    }

    function handleCase(name) {
      return ignoreCase ? name.toLowerCase() : name;
    }

    function exportNameAndKind(name, kind) {
      if (name) {
        return { name, kind };
      }
      return name;
    }

    function checkDeclaration(node) {
      const identifier = getIdentifier(node);
      const exportKind = getExportKind(node);

      if (!previousExport) {
        previousExport = exportNameAndKind(handleCase(identifier), exportKind);
      }

      // this will be missing in the case of a list of named exports
      // so we'll set it to the first named export in that case
      let currentExport = exportNameAndKind(handleCase(identifier), exportKind);

      if (!currentExport) {
        // For example, export { a, b } from 'foo'
        const namedExports = getNamedExports(node);

        let previousNamedExport = null;

        // set the current export so we can sort 'export {a}' and 'export {b}'
        currentExport = exportNameAndKind(namedExports[0] || "", exportKind);

        namedExports.forEach((currentNamedExport) => {
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
      }
      if (isKindOutOfOrder(previousExport.kind, currentExport.kind)) {
        context.report({
          message: `Expected ${currentExport.name} before ${previousExport.name}`,
          node,
        });
      }
      if (
        isSameKind(previousExport, currentExport) &&
        isOutOfOrder(previousExport.name, currentExport.name)
      ) {
        context.report({
          message: `Expected ${currentExport.name} before ${previousExport.name}`,
          node,
        });
      }

      previousExport = currentExport;
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
