# -*- coding: utf-8 -*-
"""把「创业与商业模式决策卡包」300 卡转换为 DailyQuestion 默认题库格式。

读取 CardPackStudio 的 ch01-12.json，输出：
  - questions.json  (纯 JSON 数组)
  - data.js         (window.__QUESTIONS__ = [...])
"""
import json, os

SRC_DIR = r"C:\Users\cnfea\Documents\trae_projects\CardPackStudio\cardpacks\business"
DST_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # DailyQuestion 根目录

# 章节 -> (domain, dimension, depth)
CHAPTER_META = {
    "01": ("认知与思维", ["自我觉察"], 2),
    "02": ("事业与财富", ["行动决策"], 2),
    "03": ("事业与财富", ["行动决策"], 2),
    "04": ("创作与表达", ["行动决策"], 2),
    "05": ("创作与表达", ["行动决策"], 2),
    "06": ("技能与成长", ["行动决策"], 2),
    "07": ("认知与思维", ["行动决策"], 2),
    "08": ("认知与思维", ["自我觉察"], 3),
    "09": ("事业与财富", ["行动决策"], 2),
    "10": ("事业与财富", ["行动决策"], 2),
    "11": ("关系与连接", ["关系审视"], 2),
    "12": ("意义与存在", ["自我觉察"], 3),
}


def main():
    cards = []
    for i in range(1, 13):
        num = "%02d" % i
        with open(os.path.join(SRC_DIR, "ch%02d.json" % i), "r", encoding="utf-8") as f:
            ch = json.load(f)
        domain, dimension, depth = CHAPTER_META[num]
        for card in ch["cards"]:
            if card.get("type") == "framework":
                # 框架卡 -> question=框架名, extension=描述+条目+批注
                parts = []
                if card.get("desc"):
                    parts.append(card["desc"])
                parts.extend(card.get("items", []))
                if card.get("note"):
                    parts.append(card["note"])
                q = card["name"]
                ext = " ".join(parts)
                tags = [ch["title"], "工具框架"]
                suit = ["创业者", "管理者"]
            else:
                q = card["q"]
                ext = card["h"]
                tags = [ch["title"], "创业决策"]
                suit = ["创业者"]
            cards.append({
                "id": "%03d" % (len(cards) + 1),
                "question": q,
                "extension": ext,
                "tags": tags,
                "suitable_for": suit,
                "domain": domain,
                "dimension": dimension,
                "depth": depth,
            })

    # questions.json
    with open(os.path.join(DST_DIR, "questions.json"), "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)

    # data.js
    arr = json.dumps(cards, ensure_ascii=False, indent=2)
    with open(os.path.join(DST_DIR, "data.js"), "w", encoding="utf-8") as f:
        f.write("window.__QUESTIONS__ = " + arr + ";\n")

    print("转换完成：共 %d 道题" % len(cards))
    print("questions.json ->", os.path.join(DST_DIR, "questions.json"))
    print("data.js         ->", os.path.join(DST_DIR, "data.js"))


if __name__ == "__main__":
    main()
