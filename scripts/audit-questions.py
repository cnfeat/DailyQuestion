"""
日课一问 · 好问题标准审计脚本
基于 good-question skill 的 5 维度标准
"""
import json, re
from collections import Counter

# ═══ 好问题标准 ═══

# 1. 来源引用检测
SOURCE_PATTERNS = [
    r'有人说', r'据说', r'书上说', r'文章说', r'-[^-]',  # 破折号（可能是引用残留）
]

# 2. 未解释术语
JARGON_TERMS = [
    'PMF', 'MVP', 'ROI', 'OKR', 'KPI', 'SOP', 'B2B', 'B2C', 'SaaS',
    '复利', '护城河', '飞轮', '闭环', '颗粒度', '赋能', '抓手',
    '第一性原理', '底层逻辑', '认知升级', '刻意练习', '心智模型',
    '信息茧房', '幸存者偏差', '确认偏误', '损失厌恶',
    '熵增', '反脆弱', '心流', '峰终定律', '马太效应',
]

# 3. 学术腔
ACADEMIC_PATTERNS = [
    r'从.*角度', r'基于.*框架', r'以.*视角',
    r'底层逻辑', r'第一性', r'认知框架',
]

# 4. 选择疑问句（不是开放性问题）
CHOICE_PATTERN = r'是.*还是'

# 5. 双重否定
DOUBLE_NEG_PATTERN = r'不是不'

# 6. 非问句
NON_QUESTION_PATTERN = r'[。！]'  # ends with period/exclamation

# 7. 好问题主问题长度标准
QUESTION_MIN = 12
QUESTION_MAX = 45

# 8. extension 应有 3 个延伸小问
EXTENSION_MIN = 50

def audit_questions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # 过滤掉 _instructions
    questions = [q for q in questions if q.get('question') and not q.get('_instructions')]
    
    results = {
        'total': len(questions),
        'passed': 0,
        'issues': [],
        'summary': Counter()
    }
    
    for q in questions:
        qid = q['id']
        qt = q.get('question', '')
        ex = q.get('extension', '')
        issues = []
        
        # ── 检查 1: 是否以问号结尾
        if not qt.strip().endswith('？') and not qt.strip().endswith('?'):
            issues.append('非问句')
            results['summary']['非问句'] += 1
        
        # ── 检查 2: 选择题句式
        if re.search(CHOICE_PATTERN, qt):
            issues.append('选择题句式（是A还是B）')
            results['summary']['选择题句式'] += 1
        
        # ── 检查 3: 双重否定
        if re.search(DOUBLE_NEG_PATTERN, qt):
            issues.append('双重否定（不是不）')
            results['summary']['双重否定'] += 1
        
        # ── 检查 4: 来源引用
        for pat in SOURCE_PATTERNS:
            if re.search(pat, qt) or re.search(pat, ex):
                issues.append(f'来源引用残留')
                results['summary']['来源引用'] += 1
                break
        
        # ── 检查 5: 未解释术语
        found_jargon = []
        for term in JARGON_TERMS:
            if term in qt or term in ex:
                found_jargon.append(term)
        if found_jargon:
            issues.append(f'术语: {", ".join(found_jargon[:3])}')
            results['summary']['术语未解释'] += 1
        
        # ── 检查 6: 学术腔
        for pat in ACADEMIC_PATTERNS:
            if re.search(pat, qt):
                issues.append('学术腔')
                results['summary']['学术腔'] += 1
                break
        
        # ── 检查 7: 主问题长度
        q_len = len(qt)
        if q_len < QUESTION_MIN:
            issues.append(f'主问题过短 ({q_len}字)')
            results['summary']['主问题过短'] += 1
        elif q_len > QUESTION_MAX:
            issues.append(f'主问题过长 ({q_len}字)')
            results['summary']['主问题过长'] += 1
        
        # ── 检查 8: extension 长度
        if len(ex) < EXTENSION_MIN:
            issues.append(f'延伸过短 ({len(ex)}字)')
            results['summary']['延伸过短'] += 1
        
        if not issues:
            results['passed'] += 1
        else:
            results['issues'].append({
                'id': qid,
                'question': qt[:60] + ('...' if len(qt) > 60 else ''),
                'issues': issues
            })
    
    return results

def print_report(results):
    print(f"\n{'='*60}")
    print(f"  日课一问 · 好问题标准审计报告")
    print(f"{'='*60}")
    print(f"\n  总题数: {results['total']}")
    print(f"  通过: {results['passed']} ({results['passed']/results['total']*100:.0f}%)")
    print(f"  有问题: {len(results['issues'])} ({len(results['issues'])/results['total']*100:.0f}%)")
    
    print(f"\n  ── 问题类型分布 ──")
    for issue_type, count in results['summary'].most_common():
        print(f"    {issue_type}: {count} 题")
    
    print(f"\n  ── 问题详情 (前 30 条) ──")
    for item in results['issues'][:30]:
        print(f"  [{item['id']}] {', '.join(item['issues'])}")
        print(f"       {item['question']}")
    
    if len(results['issues']) > 30:
        print(f"\n  ... 还有 {len(results['issues']) - 30} 条")

if __name__ == '__main__':
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else 'questions.json'
    results = audit_questions(path)
    print_report(results)
