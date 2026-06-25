"""
生成 A6 卡片 PDF HTML — 从最新 questions.json
输出: downloads/日课一问_完整版.html
"""
import json

HTML_TEMPLATE = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>日课一问 · 完整版</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ═══ Aesop Warm + Kenya Hara 色彩系统 ═══ */
  :root {
    --paper: #faf8f5;
    --ink: #1a1a1a;
    --ink-soft: #5c5852;
    --ink-faint: #c4bfb7;
    --brand: #5a8a6e;
    --brand-light: rgba(90,138,110,0.12);
  }

  @page { size: 105mm 148mm; margin: 0; }

  @media print {
    html, body {
      margin: 0 !important; padding: 0 !important;
      width: 105mm !important; background: none !important;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    body { display: block !important; padding: 0 !important; }
    .card {
      display: flex !important; flex-direction: column;
      width: 105mm !important; height: 148mm !important;
      margin: 0 !important; padding: 0 !important;
      box-shadow: none !important; border-radius: 0 !important;
      overflow: hidden !important; break-inside: avoid !important;
      break-after: page !important; page-break-after: always !important;
      page-break-inside: avoid !important;
    }
    .card:last-child { break-after: auto !important; page-break-after: auto !important; }
    .print-tip { display: none !important; }
  }

  body {
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #f3efe8; display: flex; flex-direction: column;
    align-items: center; padding: 20px 0;
  }

  .print-tip {
    background: var(--brand); color: #fff; padding: 10px 28px;
    font-size: 13px; cursor: pointer; border: none; letter-spacing: 1px;
    margin-bottom: 24px;
  }

  /* ═══ 卡片容器 ═══ */
  .card {
    width: 105mm; height: 148mm;
    background: var(--paper);
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(60,50,30,0.05), 0 4px 16px rgba(60,50,30,0.04);
    display: flex; flex-direction: column;
    overflow: hidden; position: relative;
  }

  /* 纸质纹理 */
  .card::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.3;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,119,91,0.006) 2px, rgba(139,119,91,0.006) 3px),
      repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(139,119,91,0.004) 4px, rgba(139,119,91,0.004) 5px);
  }

  /* 顶部品牌线 */
  .card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(90,138,110,0.5) 20%, var(--brand) 50%, rgba(90,138,110,0.5) 80%, transparent 100%);
    opacity: 0.4;
  }

  .card-inner {
    flex: 1; display: flex; flex-direction: column;
    padding: 10mm 9mm 10mm 9mm; height: 100%; position: relative; z-index: 1;
  }

  /* ═══ 封面 ═══ */
  .cover { background: var(--brand); color: #fff; }
  .cover::before { display: none; }
  .cover::after { display: none; }
  .cover .card-inner { align-items: center; justify-content: center; text-align: center; }
  .cover-title {
    font-size: 38pt; font-weight: 700; letter-spacing: 6px;
    margin-bottom: 5mm;
  }
  .cover-subtitle {
    font-size: 13pt; font-weight: 300; letter-spacing: 10px;
    margin-bottom: 18mm; opacity: 0.75;
  }
  .cover-count {
    font-size: 18pt; font-weight: 400; letter-spacing: 4px;
    margin-bottom: 3mm;
  }
  .cover-domain {
    font-size: 8pt; opacity: 0.5; letter-spacing: 2px;
    max-width: 70mm; line-height: 1.8;
  }

  /* ═══ 卡片头部 ═══ */
  .card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 13mm; }
  .card-brand { font-size: 7pt; color: var(--brand); letter-spacing: 2px; font-weight: 500; text-transform: uppercase; }
  .card-id { font-size: 6.5pt; color: var(--ink-faint); letter-spacing: 1px; }

  /* ═══ 问题 ═══ */
  .question {
    font-size: 15pt; line-height: 1.55; color: var(--ink); font-weight: 700;
    letter-spacing: 0.5px; margin-bottom: 10mm;
  }

  /* ═══ 分割线 ═══ */
  .divider {
    width: 16mm; height: 1px; background: var(--brand);
    opacity: 0.45; margin-bottom: 10mm;
  }

  /* ═══ 延伸反思 ═══ */
  .extension {
    font-size: 10pt; line-height: 1.8; color: var(--ink-soft);
    overflow: hidden; margin-bottom: 6mm; font-weight: 300;
  }

  /* ═══ 领域标签 ═══ */
  .domain-tag { margin-top: auto; padding-top: 6mm; }
  .domain-tag span {
    font-size: 7pt; color: var(--brand); letter-spacing: 1.5px;
    padding: 1mm 3mm; background: var(--brand-light);
  }
</style>
</head>
<body>
<button class="print-tip" onclick="window.print()">🖨 打印为 PDF（另存为 PDF）</button>
{cards}
</body>
</html>'''

CARD_TEMPLATE = '''
<div class="card">
  <div class="card-inner">
    <div class="card-header">
      <span class="card-brand">日课一问</span>
      <span class="card-id">NO.{id}</span>
    </div>
    <div class="question">{question}</div>
    <div class="divider"></div>
    <div class="extension">{extension}</div>
    <div class="domain-tag"><span>{domain}</span></div>
  </div>
</div>'''

COVER_TEMPLATE = '''
<div class="card cover">
  <div class="card-inner">
    <div class="cover-title">日课一问</div>
    <div class="cover-subtitle">每 日 三 省 · 破 局 人 生</div>
    <div class="cover-count">{count} 道</div>
    <div class="cover-domain">{domains}</div>
  </div>
</div>'''

def generate():
    with open('questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    real = [q for q in questions if q.get('question') and not q.get('_instructions')]
    
    # 封面
    domains = sorted(set(q.get('domain', '') for q in real))
    cover = COVER_TEMPLATE.format(count=len(real), domains=' · '.join(domains))
    
    # 卡片
    cards_html = cover
    for q in real:
        cards_html += CARD_TEMPLATE.format(
            id=q['id'],
            question=q['question'],
            extension=q.get('extension', ''),
            domain=q.get('domain', '')
        )
    
    html = HTML_TEMPLATE.replace('{cards}', cards_html)
    
    output_path = 'downloads/日课一问_完整版.html'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f'已生成 {output_path} (含 {len(real)} 张卡片 + 封面)')
    print('打开后点顶部按钮即可打印为 PDF')

if __name__ == '__main__':
    generate()
