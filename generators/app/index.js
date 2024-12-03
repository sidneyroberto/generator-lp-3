"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const { execSync } = require("child_process");
const { writeFileSync, existsSync, readFileSync } = require("fs");

module.exports = class extends Generator {
  async prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(`Bem vindo ao ${chalk.red("generator-lp-3")}!`));

    this.answers = await this.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Digite o nome do projeto:",
        default: "meu-projeto-de-lp3"
      }
    ]);
  }

  writing() {
    const { projectName } = this.answers;
    this.destinationRoot(this.destinationPath(projectName));
    this.log(`Criando a pasta do projeto ${projectName} e o inicializando...`);

    execSync("yarn init -y", {
      cwd: this.destinationPath(""),
      stdio: "inherit"
    });

    const tsConfig = {
      compilerOptions: {
        lib: ["es5", "es6"],
        target: "es5",
        module: "commonjs",
        moduleResolution: "node",
        outDir: "./build",
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        sourceMap: true,
        esModuleInterop: true
      }
    };

    writeFileSync(
      this.destinationPath("tsconfig.json"),
      JSON.stringify(tsConfig, null, 2)
    );

    const gitIgnore = `.idea/
.vscode/
node_modules/
build/
tmp/
temp/`;

    writeFileSync(this.destinationPath(".gitignore"), gitIgnore);

    const appContent = `import express from "express";
import cors from "cors";
import logger from "morgan";

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger("dev"));

app.get("/", (req, res) => {
  res.send("API"); 
});

export default app;`;
    this.fs.write(this.destinationPath("src/app.ts"), appContent);

    const serverContent = `import app from "./app";

const port = process.env.PORT || 3001;

app.listen(port, () => console.log("API em execução"));`;
    this.fs.write(this.destinationPath("src/server.ts"), serverContent);

    const packageJsonPath = this.destinationPath("package.json");
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      packageJson.scripts = {
        start: "ts-node src/server.ts",
        dev: "nodemon --exec ts-node src/server.ts"
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } else {
      this.log("package.json não encontrado. Pulando a modificação do script.");
    }
  }

  install() {
    const projectDir = this.destinationRoot();
    this.log("Instalando dependências...");

    const dependencies = ["cors", "express", "morgan"];

    execSync(`yarn add ${dependencies.join(" ")}`, {
      cwd: projectDir,
      stdio: "inherit"
    });

    const devDependencies = [
      "typescript",
      "@types/node",
      "ts-node",
      "@types/cors",
      "@types/express",
      "@types/morgan",
      "nodemon"
    ];

    execSync(`yarn add ${devDependencies.join(" ")} -D`, {
      cwd: projectDir,
      stdio: "inherit"
    });
  }

  end() {
    this.log("Geração do projeto completa!");
  }
};
