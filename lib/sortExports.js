const { minimatch } = require("minimatch");

module.exports = {
  meta: {
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
          pattern: {
            type: "string",
          },
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
          disableAutofixer: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],

    fixable: "code",
  },

  create(context) {
    const config = context.options[0] || {};

    const {
      sortDir = "asc",
      pattern,
      ignoreCase = false,
      sortExportKindFirst = "none",
      disableAutofixer = false,
    } = config;

    const sourceCode = context.getSourceCode();

    let previousExport = null;

    /**
     *
     * @param {object} node
     * @returns {string}
     */
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

    /**
     *
     * @param {object} node
     * @returns {string|undefined}
     */
    function getExportKind(node) {
      return node.exportKind;
    }

    /**
     *
     * @param {object} node
     * @returns {string[]|undefined}
     */
    function getNamedExports(node) {
      const { specifiers } = node;
      if (specifiers) {
        return specifiers
          .filter((s) => s.type === "ExportSpecifier")
          .map((s) => ({ name: s.exported.name, node: s }));
      }
      return [];
    }

    /**
     *
     * @param {string} first
     * @param {string} second
     * @returns
     */
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

    /**
     *
     * @param {string} first
     * @param {string} second
     * @returns
     */
    function isKindOutOfOrder(first, second) {
      if (sortExportKindFirst === "value") {
        return first < second;
      } else if (sortExportKindFirst === "type") {
        return first > second;
      }
      return false;
    }

    /**
     *
     * @param {string} name
     * @returns {string}
     */
    function handleCase(name = "") {
      return ignoreCase ? name.toLowerCase() : name;
    }

    function exportNameKindNode(name, kind, node) {
      if (name) {
        return { name, kind, node };
      }
      return "";
    }

    /**
     *
     * @param {object} node
     */
    function checkDeclaration(node) {
      const identifier = getIdentifier(node);
      const exportKind = getExportKind(node);

      if (!previousExport) {
        previousExport = exportNameKindNode(
          handleCase(identifier),
          exportKind,
          node,
        );
      }

      // this will be missing in the case of a list of named exports
      // so we'll set it to the first named export in that case
      let currentExport = exportNameKindNode(
        handleCase(identifier),
        exportKind,
        node,
      );

      if (!currentExport) {
        // For example, export { a, b } from 'foo'
        const namedExports = getNamedExports(node);

        let previousNamedExport = null;

        // set the current export so we can sort 'export {a}' and 'export {b}'
        currentExport = exportNameKindNode(
          (namedExports[0] && namedExports[0].name) || "",
          exportKind,
          node,
        );

        namedExports.forEach((currentNamedExport) => {
          if (!previousNamedExport) {
            previousNamedExport = currentNamedExport;
          }
          if (isOutOfOrder(previousNamedExport.name, currentNamedExport.name)) {
            context.report({
              message: `Expected ${currentNamedExport.name} before ${previousNamedExport.name}`,
              node,
              fix(fixer) {
                if (disableAutofixer) {
                  return undefined;
                }

                return [
                  fixer.replaceTextRange(
                    previousNamedExport.node.range,
                    sourceCode.getText(currentNamedExport.node),
                  ),
                  fixer.replaceTextRange(
                    currentNamedExport.node.range,
                    sourceCode.getText(previousNamedExport.node),
                  ),
                ];
              },
            });
          }

          previousNamedExport = currentNamedExport;
        });
      }
      if (isKindOutOfOrder(previousExport.kind, currentExport.kind)) {
        context.report({
          message: `Expected ${currentExport.name} before ${previousExport.name}`,
          node,
          fix(fixer) {
            if (disableAutofixer) {
              return undefined;
            }

            return [
              fixer.replaceTextRange(
                previousExport.node.range,
                sourceCode.getText(node),
              ),
              fixer.replaceTextRange(
                node.range,
                sourceCode.getText(previousExport.node),
              ),
            ];
          },
        });
      }
      if (
        previousExport &&
        currentExport &&
        isSameKind(previousExport, currentExport) &&
        isOutOfOrder(previousExport.name, currentExport.name)
      ) {
        context.report({
          message: `Expected ${currentExport.name} before ${previousExport.name}`,
          node,
          fix(fixer) {
            if (disableAutofixer) {
              return undefined;
            }

            function getComments(commentNode) {
              return sourceCode.getCommentsBefore(commentNode) || [];
            }

            function getPaddingSpaces(node) {
              return Array(node.loc.start.column)
                .fill(" ")
                .join("");
            }

            const comments = sourceCode.getCommentsBefore(node);
            const previousComments = sourceCode.getCommentsBefore(
              previousExport.node,
            );

            const fixes = [];
            if (previousComments) {
              getComments(previousExport.node).forEach((comment) => {
                fixes.push(fixer.remove(comment));
                fixes.push(
                  fixer.insertTextBefore(
                    node,
                    sourceCode.getText(comment) + "\n" + getPaddingSpaces(node),
                  ),
                );
              });
            }
            if (comments) {
              getComments(node).forEach((comment) => {
                fixes.push(fixer.remove(comment));
                fixes.push(
                  fixer.insertTextBefore(
                    previousExport.node,
                    sourceCode.getText(comment) +
                      "\n" +
                      getPaddingSpaces(previousExport.node),
                  ),
                );
              });
            }

            return [
              fixer.replaceTextRange(
                previousExport.node.range,
                sourceCode.getText(node),
              ),
              fixer.replaceTextRange(
                node.range,
                sourceCode.getText(previousExport.node),
              ),
              ...fixes,
            ];
          },
        });
      }

      previousExport = currentExport;
    }

    const filename = context.getFilename();

    if (pattern && filename !== '<input>' && !minimatch(filename, pattern)) {
      return {};
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
