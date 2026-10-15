# 安装与跨项目使用

[English](setup.md) · [项目介绍](../README.zh-CN.md)

按下面的步骤，可以让各项目沿用“需要时选择和协调已有 Skill，并说明理由”的约定。这里使用独立 Skill 和用户级指引，不要求安装仓库命令行工具，也不会改写其他 Skill。请先准备支持本地 Skill 的 Codex，以及你自己使用的技能库；本项目不附带一整套专业 Skill。

## 1. 安装独立 Skill

在 Codex 中发送：

```text
Install the standalone skill from https://github.com/sky-k111/adaptive-skill-router/tree/main/skills/adaptive-workflow.
```

安装时保留整个目录。内置安装器通常写入 `$CODEX_HOME/skills/adaptive-workflow`；未设置 `CODEX_HOME` 时，对应 `~/.codex/skills/adaptive-workflow`。也可以把完整文件夹复制到 `~/.agents/skills/adaptive-workflow`。选择其中一个位置，避免留下多个同名副本。已有安装时，先核对并备份，再更新，不要覆盖个人修改。

使用独立指引不需要 Node.js，也不用安装 npm 依赖；可选脚本另有运行条件。如果要录制可复现的演示，请记下安装的提交版本，不要把会变化的 `main` 当作固定版本。

## 2. 加入各项目共用的约定

找到当前 Codex 的用户目录：设置了 `CODEX_HOME` 就使用该目录，否则使用 `~/.codex`。Windows 上通常在用户文件夹下，macOS/Linux 上通常在主目录下。切换 `CODEX_HOME` 也意味着切换配置范围。

检查其中的 `AGENTS.override.md` 和 `AGENTS.md`：前者存在且非空时，先使用前者；否则使用后者。备份实际生效的文件，然后只合并下面这一段。两者都没有提供指引时，可以创建 `AGENTS.md`。保留原有内容，不要整份替换，也不要为了套用配置而删除已有覆盖文件。

```markdown
## Installed skill selection

When a task needs selection or coordination of installed skills, read the available `adaptive-workflow` skill at the path in the current skill catalog and apply its guidance without waiting for the user to name it. If the project explicitly uses the equivalent `adaptive-skill-router` entry, use that entry instead; do not load both for the same decision. If neither is available, explain the limitation without claiming to have used it.

Use the current catalog first. Read relevant candidate instructions before adoption, respect invocation restrictions, explicit user choices and project constraints, and reuse completed work. In the first substantive response, or the first selection update after focused exploration, briefly explain in the user's language which skills you intend to use, what each contributes and why. Mark unverified choices as candidates; distinguish planned use from actual use.

Clear tasks can proceed directly without a routing announcement. Reuse guidance already read while it remains current, and end extra workflow when its contribution is complete without skipping required checks. Selection grants no extra permissions and does not initiate external search or installation.
```

也可以复制独立的[全局指引片段](../examples/global-guidance.md)。这段约定根据当前技能列表查找路径，没有固定到作者的电脑；回复语言仍随用户，不会因为配置用英文就要求用英文交流。

项目及子目录中更具体的要求仍须遵守。全局指引也有长度限制；已有内容很多时，请保持新增约定简短。规则依据见官方的[项目指引发现方式](https://learn.chatgpt.com/docs/agent-configuration/agents-md)与 [Skill 调用说明](https://learn.chatgpt.com/docs/build-skills)。

## 3. 新开对话，检查第一步回答

在项目中新开一个对话。若可用列表中还没有这个 Skill，先重启 Codex，核对安装位置和当前配置，再继续。

直接交代一个真实问题，不点名管理 Skill，也不要求它必须选择哪些能力，例如：

```text
现有 CLI 偶尔会把只存在于磁盘、没有被运行时列出的能力显示为可用。请保留当前接口和调用限制。先说明你准备怎样着手，暂时不要检查项目或修改代码。
```

确实需要选择能力时，应该能看到与任务相关的说明：准备使用什么、能解决什么，以及哪些条件还没核实。没有固定的选择数量和标准名单。首轮说明只代表准备方式，不能当作后续实际调用或完成任务的证据。边界清楚的小修改可以直接处理，无需额外提示。

## 4. 在实际任务中确认作用

准备好后，再让 Codex 开始项目工作。查看它是否真的阅读了所称采用的 Skill、相关方法是否服务于当前问题、是否复用了有效成果，以及最终检查覆盖了什么。失败和未验证部分也应保留。一份有用的记录应连起任务、首次选择、实际工作和验收，不要求与默认 Codex 对比。

## 常见问题与撤回

- 列表中没有：核对当前 `CODEX_HOME`、目录是否完整、是否被禁用，以及是否开启了新会话。文件存在不等于会话可用。
- 列表里有但读取被拒绝：检查工具沙箱能否访问技能目录，尤其是 Windows 自定义配置目录的情况。使用允许访问的安装位置，或只为必要资源配置访问范围；不要为了读取技能而开放可能包含登录信息的整个配置目录。读取失败时应说明不可用，不能宣称已经采用。
- 没有解释选择：先看实际生效的全局文件是否包含约定、项目是否有更具体要求，以及当前任务是否需要选择 Skill。不要为了出现提示而强行调用。
- 候选缺少运行条件：说明具体限制，使用可行的已有方式，不自行安装替代能力。
- 希望撤回：只从实际生效的全局文件中移除新增段落。是否卸载 Skill 可以另行决定；不要整份恢复旧备份而丢失后续修改。

这套配置用于引导行为，不承诺每次选择都正确，也不增加执行权限。不同技能库、项目约束和宿主版本可能影响实际结果。
