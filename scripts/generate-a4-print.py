"""
生成 A4 打印版 HTML — 每页 2×4=8 张卡片
输出: downloads/日课一问_A4打印版.html
"""
import json

HTML = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>日课一问 · A4 打印版</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  @page{size:297mm 210mm;margin:0}

  @media print{
    html,body{margin:0!important;padding:0!important;background:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{box-shadow:none!important;margin-bottom:0!important;break-after:page!important;page-break-after:always!important}
    .cover-page{break-after:page!important;page-break-after:always!important}
  }

  body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;background:#e8e5de;display:flex;flex-direction:column;align-items:center;padding:16px 0}

  .print-tip{background:#3C9D4E;color:#fff;padding:9px 24px;font-size:13px;cursor:pointer;border:none;letter-spacing:1px;margin-bottom:20px}

  /* A4 横版 — 4×2=A7（74mm×105mm） */
  .page{width:297mm;height:210mm;background:#fff;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.06);display:grid;grid-template-columns:74mm 74mm 74mm 74mm;grid-template-rows:105mm 105mm;gap:0;padding:0;overflow:hidden}

  /* A7 卡片（74mm×105mm） */
  .card{background:#faf8f5;display:flex;flex-direction:column;overflow:hidden;position:relative;padding:2.5mm 2mm 2mm 2mm;border:0.5px solid #e8e4dc}

  /* 顶部品牌线 */
  .card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#3C9D4E 40%,#3C9D4E 60%,transparent);opacity:.25}

  /* 封面卡片 */
  .card.cover{background:#3C9D4E;color:#fff;justify-content:center;align-items:center;text-align:center}
  .card.cover::after{display:none}
  .cover-title{font-size:9pt;font-weight:700;letter-spacing:3px;margin-bottom:1.5mm}
  .cover-sub{font-size:5pt;font-weight:300;letter-spacing:2px;opacity:.65}
  .cover-count{font-size:6pt;letter-spacing:1.5px;opacity:.5;margin-top:2mm}

  /* 卡片内部 */
  .card-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2.5mm;flex-shrink:0}
  .card-brand{font-size:5pt;color:#3C9D4E;letter-spacing:1px;font-weight:500}
  .card-id{font-size:4.5pt;color:#b8b3ac;letter-spacing:1px}

  .question{font-size:7.5pt;line-height:1.4;color:#1a1a1a;font-weight:700;margin-bottom:2mm;flex-shrink:0;letter-spacing:.2px}

  .divider{width:7mm;height:.5px;background:#3C9D4E;opacity:.35;margin-bottom:2mm;flex-shrink:0}

  .extension{font-size:5.5pt;line-height:1.5;color:#5c5852;overflow:hidden;flex:1;font-weight:300;margin-bottom:1mm}

  .domain{font-size:4.5pt;color:#2E7D38;letter-spacing:1px;flex-shrink:0;margin-top:auto;padding-top:1mm}

  /* 封面页（横版） */
  .cover-page{background:linear-gradient(155deg,#2E7D38,#3C9D4E 45%,#4CAF50);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;width:297mm;height:210mm;margin-bottom:12px;overflow:hidden}
  .cp-title{font-size:24pt;font-weight:700;letter-spacing:8px;margin-bottom:4mm}
  .cp-sub{font-size:8pt;font-weight:300;letter-spacing:6px;opacity:.65;margin-bottom:10mm}
  .cp-line{width:30mm;height:.5px;background:rgba(255,255,255,.2);margin-bottom:10mm}
  .cp-count{font-size:10pt;letter-spacing:3px;margin-bottom:2mm}
  .cp-domains{font-size:5pt;opacity:.4;letter-spacing:1.5px;max-width:200mm;text-align:center;line-height:1.8}
  .cp-footer{position:absolute;bottom:8mm;font-size:5pt;opacity:.25;letter-spacing:1px}
</style>
</head>
<body>
<button class="print-tip" onclick="window.print()">🖨 打印为 PDF</button>
{content}
</body>
</html>'''

PAGE_TMPL = '<div class="page">{cards}</div>'
CARD_TMPL = '''
<div class="card">
  <div class="card-header"><span class="card-brand">日课一问</span><span class="card-id">NO.{id}</span></div>
  <div class="question">{question}</div>
  <div class="divider"></div>
  <div class="extension">{extension}</div>
  <div class="domain">{domain}</div>
</div>'''

def generate():
    with open('questions.json', 'r', encoding='utf-8') as f:
        qs = json.load(f)
    real = [q for q in qs if q.get('question') and not q.get('_instructions')]
    domains = sorted(set(q.get('domain', '') for q in real))

    # 封面页
    cover_html = '<div class="cover-page" style="position:relative">'
    cover_html += '<div class="cp-title">日课一问</div>'
    cover_html += '<div class="cp-sub">每 日 三 省 · 破 局 人 生</div>'
    cover_html += '<div class="cp-line"></div>'
    cover_html += f'<div class="cp-count">{len(real)} 道灵魂拷问 · A4 打印版</div>'
    cover_html += '<div class="cp-domains">' + ' · '.join(domains) + '</div>'
    cover_html += '<div class="cp-footer">卡片创作实验室出品 · github.com/cnfeat/DailyQuestion</div>'
    cover_html += '</div>'

    # 卡片页：每页 8 张
    pages = cover_html
    cards_buf = []
    for i, q in enumerate(real):
        card = CARD_TMPL.format(id=q['id'], question=q['question'],
                                 extension=q.get('extension', ''), domain=q.get('domain', ''))
        cards_buf.append(card)
        if len(cards_buf) == 8:
            pages += PAGE_TMPL.format(cards=''.join(cards_buf))
            cards_buf = []
    if cards_buf:
        pages += PAGE_TMPL.format(cards=''.join(cards_buf))

    html = HTML.replace('{content}', pages)
    path = 'downloads/日课一问_A4打印版.html'
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'{path} ({len(real)}卡 / {(len(real)+7)//8 + 1}页)')

    # 生成 PDF
    import subprocess, os
    chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe"
    out = os.path.join('downloads', '日课一问_A4打印版.pdf')
    abs_html = os.path.abspath(path)
    abs_out = os.path.abspath(out).replace('\\', '/')
    subprocess.run([chrome, '--headless', '--disable-gpu',
                    f'--print-to-pdf={abs_out}', '--no-pdf-header-footer', abs_html],
                   capture_output=True, timeout=60)
    print(f'{out} 已生成')

if __name__ == '__main__':
    generate()
