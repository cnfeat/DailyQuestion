"""
日课一问 · 术语嵌入解释脚本
在 extension 开头自然嵌入术语解释（方案 B）
"""
import json, re

# 术语 → 自然解释（嵌入 extension 开头）
JARGON_EXPLAIN = {
    '复利': '像滚雪球一样越滚越大的积累效应，就是常说的复利——',
    '护城河': '护城河就是别人难以复制、学不走的核心优势——',
    '闭环': '从起点到终点形成完整的自我循环，业界称为闭环——',
    '信息茧房': '信息茧房是指你只看得到跟自己观点一致的信息，其他都被过滤掉了——',
    '心流': '心流是指完全沉浸、忘记时间流逝的投入状态——',
    '底层逻辑': '底层逻辑就是一个事情最根本的运转原理——',
    '赋能': '赋能是给他人或团队注入能力和资源——',
    'ROI': 'ROI就是投入产出比，你花的时间/钱和得到的回报之间的比例——',
    'MVP': 'MVP就是先做一个最简单的版本，快速验证想法是否有人需要——',
    'PMF': 'PMF就是你的产品找到了一个真实存在的用户需求，用户反复使用、愿意付费、还推荐给别人——',
    '抓手': '抓手就是可以马上落地执行的具体切入口——',
    '飞轮': '飞轮是指各个环节互相推动加速，像轮子越转越快——',
    '颗粒度': '颗粒度就是做事的精细程度——',
}

def has_jargon(question, extension):
    """检查是否包含未解释的术语"""
    text = question + extension
    found = []
    for term in JARGON_EXPLAIN:
        if term in text:
            # 检查是否已有解释（extension 中是否包含了这个术语的解释性文字）
            if term not in extension[:30]:  # 在开头没解释过的才算
                found.append(term)
    return found

def fix_extensions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # 跳过 _instructions
    real_qs = [q for q in questions if q.get('question') and not q.get('_instructions')]
    instructions = [q for q in questions if q.get('_instructions')]
    
    fixed = 0
    for q in real_qs:
        jargon = has_jargon(q['question'], q['extension'])
        if jargon:
            # 在 extension 开头嵌入解释
            prefixes = []
            for term in jargon:
                if term in JARGON_EXPLAIN:
                    prefixes.append(JARGON_EXPLAIN[term])
            prefix = ''.join(prefixes)
            q['extension'] = prefix + q['extension']
            fixed += 1
    
    # 重建数组
    result = instructions + real_qs
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f'已修复 {fixed} 题，在 extension 开头嵌入了术语解释')

if __name__ == '__main__':
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else 'questions.json'
    fix_extensions(path)
