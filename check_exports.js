const lib = require("react-resizable-panels");
console.log("Exports:", Object.keys(lib));
try {
  const packageJson = require("react-resizable-panels/package.json");
  console.log("Version:", packageJson.version);
} catch (e) {
  console.log("Could not find package.json");
}
