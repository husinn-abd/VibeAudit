import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputPath = resolve(process.cwd(), "../../artifacts/mock-report.json");
const sarifPath = resolve(process.cwd(), "../../artifacts/mock-report.sarif");
const command = "tsx";
const args = [
  "src/index.ts",
  "scan",
  ".",
  "--mock",
  "--output",
  outputPath,
  "--sarif",
  sarifPath
];

const child = spawn(command, args, {
  cwd: process.cwd(),
  shell: process.platform === "win32",
  stdio: "inherit"
});

child.on("exit", async (code) => {
  if (code !== 0 && code !== 1) {
    process.exit(code ?? 2);
  }

  try {
    const report = JSON.parse(await readFile(outputPath, "utf8"));
    const findingCount = Array.isArray(report.findings) ? report.findings.length : 0;
    const policyPassed = Boolean(report.policyEvaluation?.passed);

    console.log("");
    console.log("VibeAudit mock scan demo completed.");
    console.log(`Report: ${outputPath}`);
    console.log(`SARIF: ${sarifPath}`);
    console.log(`Findings: ${findingCount}`);
    console.log(`Policy passed: ${policyPassed}`);

    if (code === 1 && policyPassed === false) {
      console.log("Policy failed as expected for the demo fixture. Quickstart is OK.");
      process.exit(0);
    }

    process.exit(code ?? 0);
  } catch (error) {
    console.error("Mock scan finished but the report could not be read.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
});

child.on("error", (error) => {
  console.error("Unable to start the mock scan.");
  console.error(error.message);
  process.exit(2);
});
