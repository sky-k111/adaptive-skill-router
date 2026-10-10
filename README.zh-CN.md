# Adaptive Skill Router

**先探索问题，只在任务能受益时使用 Skill。**

这是一个优先支持 Codex 的本地原型：发现已安装的 Skill，依据探索证据建议足够的开发方法。明确的局部修复直接完成；根因不明、验证不足、接口需要协调或后果严重时，再考虑专门的方法。

命令行工具负责发现和候选检索，**Codex 负责最终语义判断，也可以不选任何 Skill**。检索分数不代表质量、权限或已证明的 Token 节省。

工作流的作用也应体现在实际对话里：在关键判断处说明发现、采用的方法和下一项验证；新证据出现时说明调整及保留的成果；交付时说明改动解决了什么、检查到了哪里。它使用普通进度消息，不提供独立弹窗，也不要求每次对话运行完整流程。

[English](README.md) · [架构](docs/architecture.md) · [评估方法](docs/evaluation.md)

## 安装独立 Skill

想使用对话中的自适应开发工作流，安装 [adaptive-workflow](skills/adaptive-workflow/SKILL.md) 即可。它只有指引，不依赖 Node.js 或路由 CLI。在 Codex 中发送：

```text
$skill-installer 从 https://github.com/sky-k111/adaptive-skill-router/tree/main/skills/adaptive-workflow 安装 adaptive-workflow
```

安装后，可以在开发任务中显式要求 `$adaptive-workflow`，或由 Codex 在探索后仍有方法缺口时考虑使用。若列表中未出现，重启 Codex。安装使其可用，不会让每条消息都执行完整流程。安装与发现方式见 [OpenAI 官方 Skill 文档](https://learn.chatgpt.com/docs/build-skills)。

| 入口 | 用途 |
| --- | --- |
| `skills/adaptive-workflow` | 独立中文工作流：按证据选方法，在对话中说明判断、调整及验证 |
| `skills/adaptive-skill-router` | 项目版指引，附带按需读取的 CLI 发现和候选检索参考 |

两者遵循同样原则，通常选独立 Skill 或项目接入即可，无需每个任务重复读取两份。它们不会自动安装 Superpowers 或 Spec Kit、改写全局指令或授予外部操作权限。

## 可选的项目路由器

需要 Node.js 22 或更新版本。源码通过 [GitHub](https://github.com/sky-k111/adaptive-skill-router) 提供，尚未发布到 npm。

```powershell
git clone https://github.com/sky-k111/adaptive-skill-router.git
cd adaptive-skill-router
npm ci
npm run build
node dist/cli.js scan --cwd "D:/projects/my-app" --json
node dist/cli.js init --cwd "D:/projects/my-app"
node dist/cli.js init --cwd "D:/projects/my-app" --write
```

在本项目目录执行，或把 `dist/cli.js` 换成绝对路径。首次 `init` 只预览；`--write` 保留原有 `AGENTS.md`，追加带标记的接入段，并创建项目级 `.agents/skills/adaptive-skill-router/SKILL.md` 及按需读取的路由参考。已有文件发生修改时会备份到目标项目的 `.adaptive-skill-router/backups/`；按需要将备份目录加入目标项目的忽略规则。

在目标项目开启新的 Codex 会话，让它发现接入文件。生成的 Skill 复用可分发入口，绑定当前 CLI 路径与项目根目录；已有可靠会话列表时无需重复扫描。移动或卸载源码后需重新接入。不会更改全局配置或安装钩子。也可以在构建后自行执行 `npm link`，安装本地 `asr` 命令；这一步会更改 npm 的命令安装。

## 如何决定

| 观察到的情况 | 建议 |
| --- | --- |
| 尚未查看相关代码、错误和已有检查 | 先探索 |
| 修改边界、要求和验证方式已经明确 | 直接执行并验证 |
| 根因没有证实，或探索不再产生信息 | 考虑调试方法 |
| 接口依赖或要求需要协调 | 考虑规划方法 |
| 现有检查不足以覆盖行为风险 | 考虑测试方法 |
| 改动后果严重 | 考虑额外审查 |
| 未知项的性质还不清楚 | 判断需继续调查还是询问业务决定 |

`route` 输出候选，不会执行 Skill、启动模型或子 Agent。是否调用、采用哪些部分、是否值得承担后续流程成本，由 Codex 结合项目约束判断。流程可以随新证据升级或收缩。目标达成后停止追加流程。

明确的小修改不必先运行路由器或写证据文件。方法选择仍有疑问时，可以用任务文本文件及证据 JSON：

```powershell
node dist/cli.js route --task-file task.txt --evidence evidence.json --cwd "D:/projects/my-app" --json
```

证据必填 `task`（字符串）、`explored`（布尔值）、`findings` 和 `unknowns`（字符串数组）、`scope` 和 `risk`（字符串）。`task` 与任务文本严格对应；任务文件会去掉末尾空白。`scope` 可为 `local/cross-module/unknown`，`risk` 可为 `low/medium/high/unknown`。选填布尔字段包括 `rootCauseKnown`、`requirementsClear`、`verificationReady`、`regressionRisk`、`stalled`、`production`、`destructive`、`needsDomainKnowledge`、`coordinationNeeded`。只有发现实际协调需要时才设 `coordinationNeeded: true`，跨模块本身不触发规划建议。完整例子见 [示例证据](examples/unknown-bug.evidence.json)。工具验证格式，不能证明 Agent 的观察真实。

## 在对话中看到什么

例如，缓存故障的进度说明可以是：“原测试只覆盖同租户重复读取，缓存键却没有租户。我会补充跨租户返回值和加载次数检查，再修正身份边界。”如果原因仍不清楚，可以说明选用 `systematic-debugging` 的理由及实际采用部分。

需求变化时，应说明新要求影响什么、哪些成果继续有效；交付时应把实际修改和验证对应起来。简单拼写修改则复用现有测试，简短交付即可。这些说明随实际工作出现，不是固定台词、独立弹窗或必须完成的阶段。需要有真实发现和结果，单独宣告“已启用 Skill”不足以体现作用。

## Skill 可以放在哪里

Skill 源码可以放在任何维护目录。Codex 要通过支持的发现目录、符号链接/Windows 目录联接，或运行时额外根目录配置找到它。识别入口仍是 `SKILL.md`，需要 YAML 中的 `name` 和 `description`；不是随意改一个文件名就会被发现。

本工具默认扫描用户 `~/.agents/skills`、`$CODEX_HOME/skills`（通常为 `~/.codex/skills`），以及当前目录到最近 Git 根目录之间的项目 `.agents/skills`、`.codex/skills`。没有 Git 根时，项目范围只包含当前目录，并输出范围诊断；从子目录运行时，应把 `--cwd` 指向预期项目根目录，或按需显式增加 `--root`。Unix 另含 `/etc/codex/skills`。`.codex` 路径用于兼容既有安装，具体可见性取决于 Codex 版本。

```powershell
node dist/cli.js scan --root "D:/my-skill-library" --json
node dist/cli.js scan --native --codex-bin "C:/trusted/path/codex.exe" --json
node dist/cli.js inspect <扫描得到的精确ID> --json
```

`--root` 只改变本工具的扫描范围，不会自动把目录注册进 Codex。磁盘发现不等于当前会话已经加载。`--native` 查询一个新的本地 Codex app-server 进程，不发起模型任务；它比目录猜测更接近 CLI 的原生发现，但仍可能与桌面会话的插件、托管设置和策略不同。失败会明确报错，不会悄悄用磁盘结果冒充。

插件缓存仅在指定 `--include-plugin-cache` 时扫描，并标为未确认，不进入路由。禁用 Skill 不会成为候选；`agents/openai.yaml` 的 `allow_implicit_invocation: false` 会排除自动候选，用户可用 `--skill <精确ID>` 显式指定。重名 Skill 保留各自身份，不按名字合并。广泛触发和可能的连锁调用会提示给宿主判断。

## 验证与范围

```powershell
npm run check
npm pack --dry-run
node scripts/create-behavior-workspace.mjs "D:/a-new-test-sandbox"
```

自动检查覆盖扫描、调用限制、策略分支和接入文件保护。独立行为测试提供三个实际开发任务，观察 Agent 选择了什么方法及是否完成正确结果。现有测试没有证明优于默认 Codex，也没有证明降低 Token 成本；详见 [评估说明](docs/evaluation.md)。

单元测试的临时目录可用 `ASR_TEST_ROOT` 或忽略的 `.adaptive-skill-router/local-settings.json` 中 `testRoot` 配置；未配置时使用系统临时目录。测试定义随源码维护，实际行为测试副本、日志与报告放在单独测试区。`scripts/verify-behavior-workspace.mjs <完成的测试目录>` 可独立检查三个案例的验收契约。

第一版只支持 **Codex**。没有自动安装或捆绑 Superpowers、Spec Kit；单独安装并暴露给 Codex 的 Skill 可被发现，但完整框架兼容性仍需验证。目前英文词元、中文双字组合与方法匹配仅用于候选排序。

十条原则见 [英文完整说明](README.md#principles)。贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)。MIT © 2026 Ethan Chen。
