// @ts-check

import { readFileSync } from "node:fs";
import path from "node:path";
import pico from "picocolors";

const msgPath = path.resolve(".git/COMMIT_EDITMSG");
const msg = readFileSync(msgPath, "utf-8").trim();

const commitRE =
  /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/;

if (!commitRE.test(msg)) {
  console.log();
  console.error(
    `  ${pico.white(pico.bgRed(" 错误 "))} ${pico.red(`提交信息格式无效。`)}\n\n` +
      pico.red(`  自动生成变更日志需要正确的提交信息格式。示例：\n\n`) +
      `    ${pico.green(`feat(compiler): 添加 'comments' 选项`)}\n` +
      `    ${pico.green(`fix(v-model): 处理 blur 事件 (close #28)`)}\n\n` +
      pico.red(`  查看 .github/commit-convention.md 了解更多详情。\n`),
  );
  process.exit(1);
}
