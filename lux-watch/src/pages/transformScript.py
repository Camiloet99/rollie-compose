import pandas as pd
import re

# === Cargar base de datos ===
file_path = "/mnt/data/Data Entry 6_18_25.xlsx"
df_excel = pd.read_excel(file_path, sheet_name="6_18_25")
df_excel = df_excel.dropna(axis=1, how='all')
raw_column = df_excel.iloc[:, 0].dropna().astype(str)

# === Normalizar texto base ===
def clean_text(text):
    return re.sub(r'[^\x00-\x7F$]+', '', text).strip().lower()

df_cleaned = pd.DataFrame({'Cleaned_Text': raw_column.apply(clean_text)})
df_cleaned = df_cleaned[df_cleaned['Cleaned_Text'].str.len() >= 20]
df_cleaned = df_cleaned[~df_cleaned['Cleaned_Text'].str.contains(r'[\[\]:]')]
df_cleaned.reset_index(drop=True, inplace=True)

# === Extraer Moneda ===
currency_keywords = ['hkd', 'hk', 'usd', 'usdt', 'kd']
currency_pattern = r'(?:' + '|'.join(currency_keywords) + r')(?=\d|\$|[.,]|[\s]|$)'

def extract_currency(text):
    matches = re.findall(currency_pattern, text)
    for c in currency_keywords:
        if c in matches or re.search(r'\b' + c + r'\b', text):
            return c.upper()
    return None

df_cleaned['Currency'] = df_cleaned['Cleaned_Text'].apply(extract_currency)
df_cleaned['Cleaned_Text'] = df_cleaned.apply(
    lambda row: re.sub(row['Currency'].lower(), '', row['Cleaned_Text']).strip()
    if row['Currency'] else row['Cleaned_Text'], axis=1)

# === Extraer Condiciones ===
base_conditions = [
    "without box", "brand new", "brand-new", "brandnew", "like new", "like-new", "likenew",
    "like used", "like-used", "likeused", "pre owned", "pre-owned", "preowned",
    "used", "new", "unworn", "mint", "lnib", "bnib", "good condition"
]
numeric_conditions = [f"n{i}" for i in range(1, 21)]
percent_conditions = [f"{p}%" for p in (70, 80, 85, 90, 95, 97, 99)]
condition_keywords = base_conditions + numeric_conditions + percent_conditions

def extract_all_conditions(text):
    found = []
    for cond in condition_keywords:
        if cond in text:
            found.append(cond)
    return ", ".join(found) if found else None

def remove_detected_conditions(text, conditions):
    if not conditions:
        return text
    for cond in conditions.split(', '):
        text = text.replace(cond, '')
    return text.strip()

df_cleaned['Condition'] = df_cleaned['Cleaned_Text'].apply(extract_all_conditions)
df_cleaned['Cleaned_Text'] = df_cleaned.apply(
    lambda row: remove_detected_conditions(row['Cleaned_Text'], row['Condition']), axis=1)

# === Extraer Fecha (incluye formatos como "1/24", "/25") ===
def extract_date_fixed(text):
    patterns = [
        r'\b(0?[1-9]|1[0-2])[/\-\.](19[0-9]{2}|20[0-4][0-9]|2050)\b',
        r'\b(19[0-9]{2}|20[0-4][0-9]|2050)[/\-\.](0?[1-9]|1[0-2])\b',
        r'\b[yY][\s\-]?(19[0-9]{2}|20[0-4][0-9]|2050)\b',
        r'\b(19[0-9]{2}|20[0-4][0-9]|2050)[yY]\b',
        r'\b(19[0-9]{2}|20[0-4][0-9]|2050)\b',
        r'\b([1-2][0-9])[yY]\b',
        r'\b(0?[1-9]|1[0-2])\/(2[0-9])\b',
        r'(?<=\s)/2[0-9](?=\s|$)'
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None

def remove_detected_date(text, date):
    if not date:
        return text
    return text.replace(date, '').replace('  ', ' ').strip()

df_cleaned['Date'] = df_cleaned['Cleaned_Text'].apply(extract_date_fixed)
df_cleaned['Cleaned_Text'] = df_cleaned.apply(
    lambda row: remove_detected_date(row['Cleaned_Text'], row['Date']), axis=1)

# === Extraer Precio ===
def extract_price(text):
    dollar_match = re.search(r'\$\s?[\d,]+(?:\.\d+)?(?:\s?[kKmM])?', text)
    if dollar_match:
        return dollar_match.group(0).replace(" ", "")
    km_match = re.search(r'\b\d+(?:[.,]\d+)?\s?[kKmM]\b', text)
    if km_match:
        return km_match.group(0).replace(" ", "")
    sep_match = re.findall(r'\b\d{1,3}(?:[,.]\d{3})+\b', text)
    if sep_match:
        return max(sep_match, key=lambda x: float(x.replace(",", "").replace(".", "")))
    isolated = [w for w in text.split() if w.isdigit()]
    if isolated:
        return max(isolated, key=lambda x: int(x))
    return None

df_cleaned['Price'] = df_cleaned['Cleaned_Text'].apply(extract_price)
df_cleaned['Cleaned_Text'] = df_cleaned.apply(
    lambda row: re.sub(re.escape(row['Price']), '', row['Cleaned_Text']).strip()
    if row['Price'] else row['Cleaned_Text'], axis=1)

# === Eliminar descuentos tipo "-10%" ===
df_cleaned['Cleaned_Text'] = df_cleaned['Cleaned_Text'].apply(
    lambda text: re.sub(r'-\s?\d{1,3}%+', '', text).strip())

# === Extraer Set ===
set_keywords = ["full set", "fullset", "full", "naked", "watch only", "only watch"]
set_pattern = r'\b(?:' + '|'.join(re.escape(word) for word in set_keywords) + r')\b'

df_cleaned['Set'] = df_cleaned['Cleaned_Text'].apply(
    lambda text: (m := re.search(set_pattern, text)) and m.group(0)
)
df_cleaned['Cleaned_Text'] = df_cleaned.apply(
    lambda row: re.sub(re.escape(row['Set']), '', row['Cleaned_Text']).strip()
    if row['Set'] else row['Cleaned_Text'], axis=1)

# === Extraer TODOS los colores presentes ===
color_keywords = [
    "black", "white", "silver", "gold", "yellow", "green", "blue", "red", "pink", "gray", "grey", "brown",
    "chocolate", "champagne", "rose", "olive", "jade", "pistachio", "diamond", "snow", "salmon", "orange",
    "beige", "cream", "ivory", "bronze", "copper", "purple", "turquoise", "navy", "khaki", "pearl", "plum",
    "teal", "camel", "sand", "taupe", "gunmetal", "coral", "aubergine", "lilac", "lavender", "fuchsia",
    "mocha", "coffee", "sapphire", "ruby", "emerald", "cobalt", "onyx", "caramel", "floral", "candy",
    "rainbow", "choco", "ceramic", "carbon", "diamon", "ice", "iceblue", "leather", "smoke", "steel", "titanium", "titan",
    "aluminium", "aluminum", "platinum", "pewter", "brass", "copper", "graphite", "charcoal", "mint", "citrus"
]
modifiers = ["light", "dark", "foggy", "matte", "bright", "deep", "dusty", "hot", "baby", "smoky", "midnight", "royal"]
composite_colors = [f"{mod} {col}" for mod in modifiers for col in color_keywords]
full_color_list = composite_colors + color_keywords
color_pattern = r'\b(?:' + '|'.join(map(re.escape, full_color_list)) + r')\b'

def extract_all_colors(text):
    return ", ".join(re.findall(color_pattern, text)) or None

def remove_detected_colors(text, colors):
    if not colors:
        return text
    for c in colors.split(', '):
        text = text.replace(c, '')
    return text.strip()

df_cleaned['Color'] = df_cleaned['Cleaned_Text'].apply(extract_all_colors)
df_cleaned['Cleaned_Text'] = df_cleaned.apply(
    lambda row: remove_detected_colors(row['Cleaned_Text'], row['Color']), axis=1)

# === Eliminar filas sin precio ===
df_cleaned = df_cleaned[df_cleaned['Price'].notna()].reset_index(drop=True)
