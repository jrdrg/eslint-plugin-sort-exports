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
      enum: ["asc", "desc"],
    },
    {
      type: "object",
      properties: {
        ignoreCase: {
          type: "boolean",
        },
      },
      additionalProperties: false,
    },
  ],

  create(context) {
    const sortDir = context.options[0] || "asc";
    const config = context.options[1] || {};

    const { ignoreCase = false } = config;

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
        return first < second;
      }
      return first > second;
    }

    function handleCase(name) {
      return ignoreCase ? name.toLowerCase() : name;
    }

    return {
      ExportNamedDeclaration(node) {
        const identifier = getIdentifier(node);
        if (!previousExport) {
          previousExport = handleCase(identifier);
        }

        const previousIdentifier = previousExport;
        const currentIdentifier = handleCase(identifier);

        if (!currentIdentifier) {
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
          });
        } else {
          if (isOutOfOrder(previousIdentifier, currentIdentifier)) {
            context.report({
              message: `Expected ${currentIdentifier} before ${previousIdentifier}`,
              node,
            });
          }
        }

        previousExport = handleCase(identifier);
      },
    };
  },
};
