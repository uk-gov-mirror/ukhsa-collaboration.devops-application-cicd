export default [
  { ignores: ["dist/**", "coverage/**"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { document: "readonly", process: "readonly" },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "error",
    },
  },
];
