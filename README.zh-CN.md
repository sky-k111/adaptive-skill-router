# Adaptive Workflow

**根据当前任务，合理使用已经安装的 Codex Skill。**

[English](README.md) · [Skill 使用指引](skills/adaptive-workflow/SKILL.md) · [可选命令行工具](docs/router.md) · [工程验证](docs/evaluation.md)

Adaptive Workflow 帮助 Codex 管理已有 Skill 的使用：判断当前任务是否需要额外能力，从已安装的候选中选择合适的方法，协调重叠流程，并在完成所需工作后及时结束。问题清楚、现有工具已经够用时，可以直接处理。

它使用宿主已有的 Skill 列表和工具，不要求额外安装框架、接入在线服务或运行命令行程序。为兼容现有安装，保留 `adaptive-workflow` 和 `adaptive-skill-router` 两个名称；后者是用于项目接入的等效入口，同一次判断使用其中一个即可。

## 核心能力

| 能力 | 具体作用 |
| --- | --- |
| 判断是否需要 Skill | 明确当前缺少的贡献；自身推理和已有工具足够时，不额外调用 |
| 选择合适的已安装 Skill | 先根据描述筛选，再阅读实际指令，核对运行前提与后续工作 |
| 协调多个 Skill | 让必要的能力各司其职，处理流程重叠与指令冲突，复用已完成的成果 |
| 随任务调整使用方式 | 需求、前提或执行结果变化时重新判断；所需贡献完成后结束额外流程 |

重要选择应在对话里说明：为什么需要这个 Skill，它将解决什么问题。如果某个候选不适用或缺少运行条件，且会影响下一步，也应交代原因。普通任务无需输出完整清单、固定报告或反复提示已启用。

## 安装

在 Codex 中发送：

```text
Install the standalone skill from https://github.com/sky-k111/adaptive-skill-router/tree/main/skills/adaptive-workflow.
```

也可以将仓库中的整个 `skills/adaptive-workflow` 文件夹复制到支持的 Skill 目录，例如 `~/.agents/skills/adaptive-workflow`。请保留目录结构。如果安装或更新后，列表中的内容尚未刷新，可开启新会话。宿主的发现规则见 [Codex 官方文档](https://developers.openai.com/codex/skills/)。

使用独立 Skill 的指引不需要 Node.js。可选脚本和仓库命令行工具需要 Node.js 22 或更新版本；显式配置代理需要 Node.js 24.14+。

## 使用

直接说明任务与约束，例如：

```text
用 $adaptive-workflow 帮我修复这个间歇性故障，按需要使用已经安装的 Skill。保留现有测试框架，避免重复规划或审查。
```

也可以专门询问已有能力的使用方式：

```text
用 $adaptive-workflow 判断已安装的哪些 Skill 适合当前任务，说明它们有没有流程重叠，以及是否真的需要额外调用。
```

Codex 也可以根据描述考虑使用本 Skill，但安装不意味着每条消息都会触发。它不会接管所有对话或替代宿主的调度机制。用户明确指定的 Skill，以及适用的项目约束、指令和权限，始终需要遵守。

例如，间歇性故障可能需要已安装的调查类 Skill 来定位原因，暂时无需引入规划流程；一处边界清楚的文案修改可能无需额外 Skill。这些是预期判断的示例，并非已执行任务的结果。

## 可选的本地工具

当前会话的 Skill 列表不足以支持判断时，可以使用仓库工具查看本地清单、检索描述或读取候选正文。工具提供候选，是否采用由 Codex 根据任务和实际指令判断。

```sh
npm ci
npm run build
node dist/cli.js discover "capability keywords" --cwd /path/to/project --json
node dist/cli.js inspect <exact-id> --expect <inspectionFingerprint> --cwd /path/to/project --json
```

项目接入也是可选项。先用 `node dist/cli.js init --cwd /path/to/project` 预览；添加 `--write` 后应用，并进行冲突检查和备份。具体用法见[命令行说明](docs/router.md)。

磁盘上存在文件，不等于当前对话已经可以调用。原生发现反映的是新启动的 CLI 进程。禁用、仅允许显式调用和缓存状态未确认的候选需要分别处理；同名也不代表同一来源。检查指纹能够发现入口正文、调用元数据和解析路径的变化，不覆盖所有辅助文件或运行时权限。

## 范围与保留工具

仓库保留了外部检索、固定版本的来源采集和指定文件的状态检查工具，供独立需求使用。外部发现适用于用户明确要求寻找或评估更多 Skill 的情况；本地没有合适候选时，不会因此自动联网或安装。这些工具已退出管理已安装 Skill 的主要使用路径。相关独立操作见[来源采集](docs/source-review.md)与[命令行说明](docs/router.md)。

本项目不提供全局调度、自动配置依赖或绕过权限的能力。描述与检索分数不能授权执行。结束额外流程时，仍须完成用户要求和项目规定的必要检查。

## 工程质量与验证

当前优先打磨已有能力的正确性、兼容性和使用体验，暂停功能扩张及与默认 Codex 的进一步对照。

`npm run check` 运行实现测试和确定性的路由策略检查。通过检查不代表模型推理能力更强，也不能证明节省 Token。[工程验证与历史记录](docs/evaluation.md)保留了此前的结果，包括未能证明稳定优势的对照。私人配置、原始任务材料和生成的接入文件不随项目发布。

## 贡献与许可

参与前请阅读[贡献指南](CONTRIBUTING.md)。发现可复现问题时，可通过 [GitHub Issues](https://github.com/sky-k111/adaptive-skill-router/issues) 反馈。

本项目采用 [MIT 许可证](LICENSE)。Copyright © 2026 Ethan Chen.
