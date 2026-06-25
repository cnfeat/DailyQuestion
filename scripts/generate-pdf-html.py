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
    }
    .card:last-child { break-after: auto !important; page-break-after: auto !important; }
    .print-tip { display: none !important; }
  }

  body {
    font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
    background: #f0ede8; display: flex; flex-direction: column;
    align-items: center; padding: 20px 0;
  }

  .print-tip {
    background: #3C9D4E; color: #fff; padding: 10px 28px;
    font-size: 13px; border-radius: 4px; margin-bottom: 24px;
    cursor: pointer; border: none; letter-spacing: 1px;
  }
  .print-tip:hover { opacity: 0.85; }

  /* ═══ 卡片 ═══ */
  .card {
    width: 105mm; height: 148mm; background: #ffffff;
    margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    display: flex; flex-direction: column; overflow: hidden; position: relative;
  }
  .card-inner {
    flex: 1; display: flex; flex-direction: column;
    padding: 10mm 9mm 10mm 9mm; height: 100%;
  }

  /* ═══ 封面 ═══ */
  .cover { background: #2E7D38; color: #fff; justify-content: center; }
  .cover .card-inner { align-items: center; justify-content: center; text-align: center; }
  .cover-title { font-size: 36pt; font-weight: 700; letter-spacing: 4px; margin-bottom: 6mm; }
  .cover-subtitle { font-size: 14pt; font-weight: 300; letter-spacing: 8px; margin-bottom: 16mm; opacity: 0.8; }
  .cover-meta { font-size: 9pt; opacity: 0.6; letter-spacing: 2px; }
  .cover-count { font-size: 20pt; font-weight: 500; margin-bottom: 4mm; letter-spacing: 3px; }
  .cover-domain { font-size: 9pt; opacity: 0.5; letter-spacing: 1px; }

  /* ═══ 卡片头部 ═══ */
  .card-header { display: flex; justify-content: space-between; margin-bottom: 14mm; }
  .card-brand { font-size: 8pt; color: #3C9D4E; letter-spacing: 1px; font-weight: 500; }
  .card-id { font-size: 7pt; color: #ccc; letter-spacing: 0.5px; }

  /* ═══ 内容 ═══ */
  .question { font-size: 14pt; line-height: 1.5; color: #111; font-weight: 700; letter-spacing: 0.6px; margin-bottom: 10mm; }
  .divider { width: 18mm; height: 1px; background: #3C9D4E; margin-bottom: 10mm; }
  .extension { font-size: 10pt; line-height: 1.7; color: #555; overflow: hidden; margin-bottom: 7mm; }
  .domain-tag { margin-top: auto; padding-top: 8mm; }
  .domain-tag span { font-size: 8pt; color: #2E7D38; background: #E8F5E9; padding: 1mm 3mm; letter-spacing: 0.3px; }
  .card-footnote { font-size: 5.5pt; color: #ddd; text-align: right; margin-top: 7mm; letter-spacing: 0.5px; }
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
    <div class="cover-subtitle">每日三省，破局人生</div>
    <div class="cover-count">{count} 道灵魂拷问</div>
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
