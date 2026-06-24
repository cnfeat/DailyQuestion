"""
日课一问 题库结构化重构脚本
Plan A: 修复文本瑕疵 + 补充标签
Plan B: 双层分类体系（领域×维度）+ 深度评级 + 按领域重编号
"""
import json
import re
from collections import Counter
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ═══ 配置 ═══
TAG_TO_DOMAIN = {
    "创作输出": "创作与表达",
    "底层认知": "认知与思维",
    "事业经营": "事业与财富",
    "技能成长": "技能与成长",
    "人生意义": "意义与存在",
    "关系与自我": "关系与连接",
}

DOMAIN_ORDER = ["事业与财富", "创作与表达", "技能与成长", "关系与连接", "认知与思维", "意义与存在"]

# ── 维度判定关键词 ──
SELF_AWARENESS_KW = [
    "感觉", "觉得", "内心", "情绪", "焦虑", "恐惧", "害怕", "后悔", "担心",
    "你是谁", "真正的你", "认识自己", "了解自己", "审视自己", "面对自己",
    "弱点", "缺陷", "缺点", "逃避", "否认", "自卑", "骄傲", "虚荣",
    "快乐", "幸福", "满足", "自由感", "意义感", "热情", "动力", "初心"
]
ACTION_DECISION_KW = [
    "做", "行动", "选择", "决定", "放弃", "坚持", "尝试", "改变",
    "如果今天", "如果明天", "如果现在", "下一步", "优先级",
    "花钱", "赚钱", "投资", "投入", "停止", "开始", "优化", "提升",
    "时间分配", "精力分配", "注意力", "计划", "目标", "方向",
    "会不会", "敢不敢", "能不能", "愿不愿意"
]
RELATIONSHIP_KW = [
    "别人", "他人", "家人", "父母", "孩子", "伴侣", "朋友", "同事", "客户",
    "关系", "社交", "依赖", "信任", "影响", "帮助", "沟通", "理解",
    "伴侣关系", "亲密关系", "友谊", "团队", "合作", "背叛", "辜负"
]

# ── 问题 ID 列表（有前导逗号问题的 ID） ──
LEADING_COMMA_IDS = {"077", "108", "142", "160", "210", "268"}

# ═══ 辅助函数 ═══
def fix_extension(ext):
    """去掉 extension 开头多余的逗号"""
    return re.sub(r'^[，,]\s*', '', ext)

def determine_domain(tags):
    """从旧标签推导新领域（取第一个匹配标签对应的领域）"""
    for tag in tags:
        if tag in TAG_TO_DOMAIN:
            return TAG_TO_DOMAIN[tag]
    return "认知与思维"  # 兜底

def determine_dimensions(question, extension):
    """基于关键词分析判定维度"""
    text = question + extension
    dims = []
    sa_score = sum(1 for kw in SELF_AWARENESS_KW if kw in text)
    ad_score = sum(1 for kw in ACTION_DECISION_KW if kw in text)
    rl_score = sum(1 for kw in RELATIONSHIP_KW if kw in text)
    
    if sa_score > 0:
        dims.append("自我觉察")
    if ad_score > 0:
        dims.append("行动决策")
    if rl_score > 0:
        dims.append("关系审视")
    
    # 至少保留一个维度
    if not dims:
        dims.append("自我觉察")
    return dims

def determine_depth(question, extension):
    """基于问题长度和复杂度评深度"""
    q_len = len(question)
    e_len = len(extension)
    # 问号数量反映嵌套层次
    q_marks = question.count("？") + question.count("?")
    
    if q_len < 18 and q_marks <= 1:
        return 1
    elif q_len < 30 and q_marks <= 2:
        return 2
    else:
        return 3

def renumber_by_domain(questions):
    """按领域分组后重编号，同一领域内保持原顺序"""
    buckets = {d: [] for d in DOMAIN_ORDER}
    for q in questions:
        buckets[q["domain"]].append(q)
    
    new_id = 1
    result = []
    for domain in DOMAIN_ORDER:
        for q in buckets[domain]:
            q["id"] = f"{new_id:03d}"
            new_id += 1
            result.append(q)
    return result

# ═══ 主流程 ═══
def main():
    with open("questions.json", "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    stats = {"fixed_commas": 0, "tags_bumped": 0}
    
    for q in questions:
        qid = q["id"]
        
        # ── Plan A: 修复前导逗号 ──
        if qid in LEADING_COMMA_IDS:
            old_ext = q["extension"]
            q["extension"] = fix_extension(old_ext)
            stats["fixed_commas"] += 1
        
        # ── Plan A: 单标签题目补标签 ──
        if len(q["tags"]) == 1:
            existing = q["tags"][0]
            # 从其他标签中补一个不重复的
            candidates = [t for t in TAG_TO_DOMAIN.keys() if t != existing]
            # 简单启发：如果同时涉及认知和技能，补一个
            if existing in ("底层认知",):
                q["tags"].append("人生意义")
            elif existing in ("创作输出",):
                q["tags"].append("底层认知")
            elif existing in ("技能成长",):
                q["tags"].append("事业经营")
            elif existing in ("关系与自我",):
                q["tags"].append("底层认知")
            elif existing in ("事业经营",):
                q["tags"].append("技能成长")
            else:
                q["tags"].append(candidates[0])
            stats["tags_bumped"] += 1
        
        # ── Plan B: 新分类体系 ──
        q["domain"] = determine_domain(q["tags"])
        q["dimension"] = determine_dimensions(q["question"], q["extension"])
        q["depth"] = determine_depth(q["question"], q["extension"])
    
    # ── Plan B: 按领域重编号 ──
    questions = renumber_by_domain(questions)
    
    # ── 统计 ──
    domain_counts = Counter(q["domain"] for q in questions)
    depth_counts = Counter(q["depth"] for q in questions)
    dim_counts = Counter(d for q in questions for d in q["dimension"])
    avg_tags = sum(len(q["tags"]) for q in questions) / len(questions)
    
    with open("questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 完成！修复前导逗号: {stats['fixed_commas']} 处")
    print(f"✅ 标签补充: {stats['tags_bumped']} 题 (平均标签数: {avg_tags:.1f})")
    print(f"\n── 领域分布 ──")
    for d in DOMAIN_ORDER:
        print(f"  {d}: {domain_counts[d]} 题")
    print(f"\n── 深度分布 ──")
    for d in [1, 2, 3]:
        label = {1: "浅(1)", 2: "中(2)", 3: "深(3)"}[d]
        print(f"  {label}: {depth_counts[d]} 题")
    print(f"\n── 维度分布 ──")
    for d, c in dim_counts.most_common():
        print(f"  {d}: {c} 题")
    print(f"\n── 首题预览 ──")
    print(json.dumps(questions[0], ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
