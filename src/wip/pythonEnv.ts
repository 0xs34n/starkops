import { execSync } from "child_process";
import inquirer from "inquirer";
import fs from "fs";
import fuzzy from "inquirer-fuzzy-path";
inquirer.registerPrompt("fuzzypath", fuzzy);

const ui = new inquirer.ui.BottomBar();

export default function activatePythonEnv(answers: any) {
  return new Promise((resolve, reject) => {
    try {
      ui.updateBottomBar("🏘️  Activating python environment...\n");
      execPythonEnv();
      resolve(answers);
    } catch (execError: any) {
      if (execError.stderr.includes("No such file or directory")) {
        ui.updateBottomBar("🕵️  Could not find python environment.\n");
        // ask for the env path
        inquirer
          .prompt([
            {
              type: "fuzzypath",
              name: "pythonEnv",
              // excludeFilter: (path: string) => path !== "bin/activate",
              itemType: "file",
              rootPath: "~",
              message: "Select the cairo python environment:",
            },
          ])
          .then((answers) => {
            try {
              ui.updateBottomBar("✍️  Saving python environment...");
              fs.writeFileSync(
                "./activate-venv.sh",
                `source ${answers.pythonEnv}`
              );
              execPythonEnv();
              resolve(answers);
            } catch (writeError) {
              ui.updateBottomBar("❌  Failed to save python environment.");
              reject(writeError);
            }
          });
      } else {
        ("❌  Failed to activate python environment.");
        reject(execError);
      }
    }
  });
}

function execPythonEnv() {
  execSync("sh activate-venv.sh", { stdio: "pipe" });
}
