/** @type {import("prettier").Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'auto',
  plugins: ['prettier-plugin-tailwindcss'],
};
