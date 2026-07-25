import skillCore from "@/skill/visual-gift-search/SKILL.md?raw";
import candidateSelection from "@/skill/visual-gift-search/references/candidate-selection.md?raw";
import partnerGifting from "@/skill/visual-gift-search/references/partner-gifting.md?raw";
import visualAnalysis from "@/skill/visual-gift-search/references/visual-analysis.md?raw";

const phaseHeader = (phase: string) =>
  `\n\n---\n当前执行阶段：${phase}\n仅执行当前阶段，不调用工具，不进入自治循环。`;

/**
 * Skill 以静态文本进入模型上下文，不产生额外模型调用。
 * 两个阶段只加载各自需要的 reference，source-index 只做来源审计。
 */
export const VISUAL_GIFT_SKILL_CORE = skillCore;

export const VISUAL_ANALYSIS_GUIDE = [
  phaseHeader("视觉理解"),
  visualAnalysis,
].join("\n\n");

export const CANDIDATE_SELECTION_GUIDE = [
  phaseHeader("候选选择与推荐解释"),
  candidateSelection,
  partnerGifting,
].join("\n\n");

