import json

# 1. Carregar o arquivo HAR
with open("/home/luis-cavada/Downloads/projetorota.com.br_Archive [25-09-02 18-12-34].har", "r", encoding="utf-8") as f:
    data = json.load(f)

# 2. Extrair URLs que terminam em .css
urls = []
for entry in data["log"]["entries"]:
    url = entry["request"]["url"]
    if ".css" in url and url not in urls:
        urls.append(url)

# 3. Salvar em lista
with open("css-list.txt", "w") as f:
    f.write("\n".join(urls))

print(f"Extraídas {len(urls)} URLs de CSS para css-list.txt")
