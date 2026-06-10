import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const quickstartScript = readFileSync(path.join(process.cwd(), "scripts", "quickstart.ps1"), "utf8");

describe("quickstart script contract", () => {
  it("supports machine-readable doctor reports", () => {
    expect(quickstartScript).toContain("[string]$DoctorReport");
    expect(quickstartScript).toContain("function Write-DoctorReport");
    expect(quickstartScript).toContain("schemaVersion = 1");
    expect(quickstartScript).toContain("events        = $DoctorEvents");
    expect(quickstartScript).toContain('Write-DoctorReport "passed"');
    expect(quickstartScript).toContain('Write-DoctorReport "failed"');
  });

  it("records dependency and validation events", () => {
    expect(quickstartScript).toContain("function Add-DoctorEvent");
    expect(quickstartScript).toContain('Add-DoctorEvent "dependency:$Name" "passed"');
    expect(quickstartScript).toContain('Add-DoctorEvent "dependency:pnpm" "passed"');
    expect(quickstartScript).toContain('Add-DoctorEvent "dependency:docker" "warning"');
    expect(quickstartScript).toContain('Add-DoctorEvent "step:$Name" "passed"');
  });
});
