import path from "node:path";
import { execSync } from "node:child_process";

import { build } from "esbuild";
import { rimraf } from "rimraf";
import { bundle } from "dts-bundle";
import { t } from "chainsi";

const finishedBuild = (dir: string) =>
  console.log(`${t("✔︎").green._} build: ${t(dir).blue._}`);

const PACKAGES: Record<string, { external?: string[] }> = {
  'aws-s2t': {},
  'sign': {},
  // TODO:
};

export const buildMain = () => {
  execSync("tsc -p tsconfig.build.json");

  const promises = Object.entries(PACKAGES).map(async ([pkg, { external }]) => {
    const res = await build({
      entryPoints: [path.resolve(`packages/${pkg}/src/index`)],
      bundle: true,
      minify: true,
      target: "es2018",
      outdir: `packages/${pkg}/dist`,
      external,
      format: "esm",
      plugins: [
        {
          name: "TypeScriptDeclarationsPlugin",
          setup(build: any) {
            build.onEnd(() => {
              bundle({
                name: pkg,
                main: `temp/packages/${pkg}/src/index.d.ts`,
                out: path.resolve(`packages/${pkg}/dist/index.d.ts`),
              });
            });
          },
        },
      ],
    });
    finishedBuild(`packages/${pkg}/dist`);
    return res;
  });
  return promises;
};

export const clearMain = () =>
  Object.entries(PACKAGES)
    .map(([pkg]) => `packages/${pkg}/dist`)
    .map((dir) => rimraf(dir));

(async function main() {
  console.log("clear dist...");
  await Promise.allSettled([...clearMain()]);
  console.log(`${t("✔︎").green._} finished clearing dist`);
  console.log("building...");
  const buildingMain = buildMain();
  await Promise.all([...buildingMain]);
  execSync("rm -rf temp");
})();
