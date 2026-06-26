"""
420题库 — 移除所有破折号「——」并替换为自然标点
"""
import json

def fix():
    with open('questions.json', 'r', encoding='utf-8') as f:
        qs = json.load(f)
    real = [q for q in qs if q.get('question') and not q.get('_instructions')]
    inst = [q for q in qs if q.get('_instructions')]
    
    fixed_q = fixed_e = 0
    for q in real:
        if '——' in q['question']:
            # 段落式破折号 → 逗号
            q['question'] = q['question'].replace('——', '，')
            # 清理多余连续逗号和句首句尾逗号
            q['question'] = q['question'].replace('，，', '，')
            q['question'] = q['question'].strip('，')
            fixed_q += 1
        if '——' in q['extension']:
            q['extension'] = q['extension'].replace('——', '，')
            q['extension'] = q['extension'].replace('，，', '，')
            q['extension'] = q['extension'].strip('，')
            fixed_e += 1
    
    json.dump(inst + real, open('questions.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    
    # verify
    remaining = sum(q['question'].count('——') + q['extension'].count('——') for q in real)
    print(f'Fixed Q:{fixed_q} E:{fixed_e} | Remaining dashes: {remaining}')

if __name__ == '__main__':
    fix()
