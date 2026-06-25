"""
AI Native Startup 题库 → A6 卡片 PDF
"""
import json, subprocess, os

HTML = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>AI-Native Startup · 日课一问</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#1a1a1a;--ink-soft:#5c5852;--ink-faint:#b0aba5;--brand:#3C9D4E;--brand-dark:#2E7D38;--brand-soft:rgba(60,157,78,0.10)}
@page{size:105mm 148mm;margin:0}
@media print{html,body{margin:0!important;padding:0!important;width:105mm!important;background:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{display:block!important;padding:0!important}.card{display:flex!important;flex-direction:column;width:105mm!important;height:148mm!important;margin:0!important;padding:0!important;box-shadow:none!important;overflow:hidden!important;break-inside:avoid!important;break-after:page!important;page-break-after:always!important}.card:last-child{break-after:auto!important}.print-tip{display:none!important}}
body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;background:#f3efe8;display:flex;flex-direction:column;align-items:center;padding:20px 0}
.print-tip{background:var(--brand);color:#fff;padding:10px 28px;font-size:13px;cursor:pointer;border:none;letter-spacing:1px;margin-bottom:24px}

.card{width:105mm;height:148mm;background:#fff;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.04);display:flex;flex-direction:column;overflow:hidden;position:relative;border:1.5px solid rgba(60,157,78,.25)}
.card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent 0%,rgba(60,157,78,.4) 20%,var(--brand) 50%,rgba(60,157,78,.4) 80%,transparent 100%);opacity:.35}
.card-inner{flex:1;display:flex;flex-direction:column;padding:9mm 8mm 7mm 8mm;height:100%;position:relative;z-index:1}

.cover{background:#fff;color:var(--ink);border:1.5px solid rgba(60,157,78,.25)}
.cover .card-inner{align-items:center;justify-content:center;text-align:center}
.cover-brand{font-size:7pt;letter-spacing:5px;color:var(--ink-faint);margin-bottom:12mm;font-weight:300}
.cover-title{font-size:28pt;font-weight:700;letter-spacing:8px;margin-bottom:4mm;line-height:1;color:var(--brand)}
.cover-subtitle{font-size:9pt;font-weight:300;letter-spacing:6px;margin-bottom:12mm;color:var(--ink-soft)}
.cover-line{width:20mm;height:1px;background:var(--brand);opacity:.4;margin-bottom:12mm}
.cover-count{font-size:12pt;font-weight:400;letter-spacing:3px;margin-bottom:1.5mm;color:var(--ink)}
.cover-domain{font-size:7pt;letter-spacing:2px;max-width:72mm;line-height:2;color:var(--ink-faint)}
.cover-footer{position:absolute;bottom:8mm;left:0;right:0;text-align:center;font-size:6pt;letter-spacing:1px;color:var(--ink-faint);opacity:.7}

.card-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10mm}
.card-brand{font-size:7pt;color:var(--brand);letter-spacing:2px;font-weight:500}
.card-id{font-size:6.5pt;color:var(--ink-faint);letter-spacing:1.5px}

.question{font-size:17pt;line-height:1.5;color:var(--ink);font-weight:700;letter-spacing:.3px;margin-bottom:7mm}
.divider{width:14mm;height:1px;background:var(--brand);opacity:.35;margin-bottom:7mm}
.extension{font-size:10pt;line-height:1.7;color:var(--ink-soft);overflow:hidden;flex:1;font-weight:300}
.domain-tag{margin-top:auto;padding-top:4mm}
.domain-tag span{font-size:6.5pt;color:var(--brand-dark);letter-spacing:1.5px;padding:1mm 3mm;background:var(--brand-soft)}
.card-source{font-size:5.5pt;color:var(--ink-faint);letter-spacing:.5px;text-align:center;padding-top:2mm}

.toc-card{background:#fff;border:1.5px solid rgba(60,157,78,.25)}
.toc-card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent 0%,rgba(60,157,78,.4) 20%,var(--brand) 50%,rgba(60,157,78,.4) 80%,transparent 100%);opacity:.35}
.toc-card .card-inner{padding:8mm 9mm 7mm 9mm}
.toc-title{font-size:10pt;font-weight:700;color:var(--brand);letter-spacing:2px;margin-bottom:4mm}
.toc-intro{font-size:8pt;line-height:1.7;color:var(--ink-soft);margin-bottom:5mm;font-weight:300}
.toc-logic{font-size:7pt;color:var(--ink-faint);margin-bottom:6mm;line-height:1.6}
.toc-section{font-size:6.5pt;font-weight:500;color:var(--ink);letter-spacing:1px;margin-bottom:2mm}
.toc-table{width:100%;font-size:7pt;line-height:2.2;color:var(--ink-soft);border-collapse:collapse}
.toc-table td{padding:0 1mm}
.toc-table .toc-num{text-align:right;color:var(--brand);font-weight:500;width:12mm}
.toc-table .toc-bar{width:auto;padding:0 2mm}
.toc-bar-inner{height:3px;background:var(--brand);opacity:.25;display:inline-block;vertical-align:middle}
.toc-total{font-size:7pt;color:var(--ink);margin-top:4mm;letter-spacing:1px}
.toc-total span{color:var(--brand);font-weight:700}
</style></head>
<body>
<button class="print-tip" onclick="window.print()">🖨 打印为 PDF</button>
{cards}
</body></html>'''

CARD = '''
<div class="card"><div class="card-inner">
<div class="card-header"><span class="card-brand">AI-Native Startup</span><span class="card-id">NO.{id}</span></div>
<div class="question">{question}</div><div class="divider"></div>
<div class="extension">{extension}</div>
<div class="domain-tag"><span>{domain}</span></div>
<div class="card-source">卡片创作实验室出品</div>
</div></div>'''

def gen():
    from collections import Counter
    qs = json.load(open('downloads/questions-AI-Native-Startup.json', 'r', encoding='utf-8'))
    real = [q for q in qs if q.get('question') and not q.get('_instructions')]
    domains = sorted(set(q.get('domain', '') for q in real))
    dc = Counter(q.get('domain', '') for q in real)
    max_cnt = max(dc.values()) if dc else 1

    cover = f'''<div class="card cover"><div class="card-inner">
<div class="cover-brand">A I &nbsp; N A T I V E &nbsp; S T A R T U P</div>
<div class="cover-title">日课一问</div>
<div class="cover-subtitle">A I 创 业 · 每 日 深 思</div>
<div class="cover-line"></div>
<div class="cover-count">{len(real)} 道深度追问</div>
<div class="cover-domain">{' · '.join(domains)}</div>
<div class="cover-footer">卡片创作实验室出品 · github.com/cnfeat/DailyQuestion</div>
</div></div>'''

    # 目录页
    table_rows = ''
    for d in domains:
        cnt = dc[d]
        bar_w = max(4, int(cnt / max_cnt * 40))
        table_rows += f'<tr><td>{d}</td><td class="toc-num">{cnt} 张</td><td class="toc-bar"><span class="toc-bar-inner" style="width:{bar_w}mm"></span></td></tr>'
    index = f'''<div class="card toc-card"><div class="card-inner">
<div class="toc-title">目录与简介</div>
<div class="toc-intro">「AI-Native Startup」是一套面向 AI 时代创业者的深度反思卡片。当技术门槛归零、一个人能做过去一个团队的事，创业拼的不再是速度，而是判断力。这 100 个问题帮你每天校准方向。</div>
<div class="toc-logic">卡片按三个领域组织——认知与思维、事业与财富、技能与成长。每张卡片包含一个核心问题和三个延伸追问，难度由浅入深，适合每日反思、团队讨论或写作灵感。</div>
<div class="toc-section">分类统计</div>
<table class="toc-table">{table_rows}</table>
<div class="toc-total">共 <span>{len(real)}</span> 张卡片</div>
</div></div>'''

    cards = cover + index
    for q in real:
        cards += CARD.format(id=q['id'], question=q['question'], extension=q.get('extension', ''), domain=q.get('domain', ''))
    html = HTML.replace('{cards}', cards)

    base = 'downloads/AI-Native-Startup'
    with open(f'{base}.html', 'w', encoding='utf-8') as f: f.write(html)
    print(f'{base}.html ({len(real)}卡)')

    chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe"
    subprocess.run([chrome, '--headless', '--disable-gpu', f'--print-to-pdf={os.path.abspath(base)}.pdf', '--no-pdf-header-footer', os.path.abspath(f'{base}.html')], capture_output=True, timeout=60)
    print(f'{base}.pdf ✅')

if __name__ == '__main__':
    gen()
