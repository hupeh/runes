## Git 提交信息约定

> 改编自 [Angular 的提交约定](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular)。

#### 简要说明：

提交信息必须匹配以下正则表达式：

```regexp
/^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip)(\(.+\))?: .{1,50}/
```

#### 示例

出现在 "Features" 标题下，`compiler` 子标题：

```
feat(compiler): add 'comments' option
```

出现在 "Bug Fixes" 标题下，`v-model` 子标题，并链接到 issue #28：

```
fix(v-model): handle events on blur

close #28
```

出现在 "Performance Improvements" 标题下，以及 "Breaking Changes" 下并附带破坏性变更说明：

```
perf(core): improve vdom diffing by removing 'foo' option

BREAKING CHANGE: The 'foo' option has been removed.
```

如果以下提交和提交 `667ecc1` 在同一版本下，则不会出现在变更日志中。如果不在同一版本，则回退提交会出现在 "Reverts" 标题下。

```
revert: feat(compiler): add 'comments' option

This reverts commit 667ecc1654a317a13331b17617d973392f415f02.
```

### 完整信息格式

提交信息由 **header（标题）**、**body（正文）** 和 **footer（页脚）** 组成。标题包含 **type（类型）**、**scope（范围）** 和 **subject（主题）**：

```
<type>(<scope>): <subject>
<空行>
<body>
<空行>
<footer>
```

**header** 是必需的，而 **scope** 是可选的。

### Revert（回退）

如果提交回退了之前的提交，应以 `revert: ` 开头，后跟被回退提交的标题。在正文中，应该写：`This reverts commit <hash>.`，其中 hash 是被回退提交的 SHA。

### Type（类型）

如果前缀是 `feat`、`fix` 或 `perf`，它将出现在变更日志中。但是，如果存在任何 [BREAKING CHANGE（破坏性变更）](#footer)，该提交将始终出现在变更日志中。

其他前缀由你自行决定。建议使用 `docs`、`chore`、`style`、`refactor` 和 `test` 来标记与变更日志无关的任务。

### Scope（范围）

范围可以是任何指定提交变更位置的内容。例如 `core`、`compiler`、`ssr`、`v-model`、`transition` 等...

### Subject（主题）

主题包含对变更的简洁描述：

- 使用祈使句、现在时态："change" 而不是 "changed" 或 "changes"
- 首字母不要大写
- 结尾不要加句号（.）

### Body（正文）

与 **subject** 一样，使用祈使句、现在时态："change" 而不是 "changed" 或 "changes"。
正文应包括变更的动机，并与之前的行为进行对比。

### Footer（页脚）

页脚应包含任何关于 **破坏性变更** 的信息，也是引用此提交 **关闭** 的 GitHub issues 的地方。

**破坏性变更** 应以 `BREAKING CHANGE:` 开头，后跟一个空格或两个换行符。然后使用提交信息的其余部分来描述。
