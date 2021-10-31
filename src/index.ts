#!/usr/bin/env node
"use strict";

import inquirer from "inquirer";
import { globby } from "globby";
import path from "path";
import { execSync } from "child_process";
import fs from "fs";

const ui = new inquirer.ui.BottomBar();
const __dirname = path.resolve();

// TODO: Downloading and installing Cairo

// TODO: Check if python env is enabled

// look for cairo programs in the current directory
async function getChoices(): Promise<Array<{ name: string }>> {
  const cairoFilePaths = await globby("**/*.cairo");
  const choices = cairoFilePaths.map((filePath) => ({
    name: filePath,
  }));
  return choices;
}

// look for matching json or abi in current directory
async function isNotCompiled() {
  const choices = await getChoices();

  const isNotCompiled = choices
    .filter(({ name }) => {
      const filePath = name;
      const fileName = path.parse(filePath).name;

      const doesCompiledExist = fs.existsSync(
        `${__dirname}/artifacts/${fileName}_compiled.json`
      );

      const doesAbiExist = fs.existsSync(
        `${__dirname}/artifacts/${fileName}_abi.json`
      );

      return !doesAbiExist && !doesCompiledExist;
    })
    .map((notCompiled) => notCompiled.name);

  return isNotCompiled;
}

async function main() {
  const choices = await getChoices();
  const defaultChoices = await isNotCompiled();

  if (choices.length) {
    // Compiling contracts
    inquirer
      .prompt([
        {
          type: "checkbox",
          message: "Select cairo programs to compile",
          name: "contracts",
          default: defaultChoices,
          choices: choices,
        },
      ])
      // .then(activatePythonEnv) TODO: Activate python environment
      .then((answers) => {
        const contracts = answers.contracts;
        const artifactsDirectory = `${__dirname}/artifacts`;

        try {
          // check for artifacts folder
          if (!fs.existsSync(artifactsDirectory)) {
            ui.log.write(`📂  Artifacts folder not found, creating...\n`);
            fs.mkdirSync(artifactsDirectory);
            ui.log.write(`✅ /artifacts folder created.\n\n`);
          } else {
            ui.log.write(`📂  Artifacts folder found!\n\n`);
          }

          contracts.forEach((contract: string) => {
            const filePath = contract;
            const fileName = path.parse(filePath).name;
            const fileBase = path.parse(filePath).base;

            // compile
            ui.log.write(`🔮  Compiling ${fileBase}...\n`);
            execSync(
              `starknet-compile ${contract} --output ${artifactsDirectory}/${fileName}_compiled.json --abi ${artifactsDirectory}/${fileName}_abi.json`
            );
            ui.log.write(`✅ ${fileBase} compiled.\n\n`);
          });
          ui.log.write(
            `✅  Successfully compiled cario programs in ${artifactsDirectory}!\n`
          );
        } catch (error) {
          ui.log.write(`❌  ${error}`);
        } finally {
          process.exit();
        }
      });
  } else {
    ui.log.write(
      `🔍  Could not find cairo programs in this directory: ${__dirname}.\n`
    );
    process.exit();
  }
}

main();
