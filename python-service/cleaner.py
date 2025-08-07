import re
import pandas as pd

def process_excel_and_clean(file_path):
    xls = pd.ExcelFile(file_path)
    df_excel = pd.read_excel(xls, sheet_name=xls.sheet_names[0])
    df_excel = df_excel.dropna(axis=1, how='all')
    raw_column = df_excel.iloc[:, 0].dropna().astype(str)

    def clean_text(text):
        return re.sub(r'[^\x00-\x7F$]+', '', text).strip().lower()

    df_cleaned = pd.DataFrame({'Cleaned_Text': raw_column.apply(clean_text)})
    df_cleaned = df_cleaned[df_cleaned['Cleaned_Text'].str.len() >= 20]
    df_cleaned = df_cleaned[~df_cleaned['Cleaned_Text'].str.contains(r'[\[\]:]')]
    df_cleaned.reset_index(drop=True, inplace=True)

    currency_keywords = ['hkd', 'hk', 'usd', 'usdt', 'kd']
    currency_pattern = r'(?:' + '|'.join(currency_keywords) + r')(?=\d|\$|[.,]|\s|$)'

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

    base_conditions = [
        "without box", "brand new", "brand-new", "brandnew", "like new", "like-new", "likenew",
        "like used", "like-used", "likeused", "pre owned", "pre-owned", "preowned",
        "used", "new", "unworn", "mint", "lnib", "bnib", "good condition"
    ]
    numeric_conditions = [f"n{i}" for i in range(1, 21)]
    percent_conditions = [f"{p}%" for p in (70, 80, 85, 90, 95, 97, 99)]
    condition_keywords = base_conditions + numeric_conditions + percent_conditions

    def extract_all_conditions(text):
        return ", ".join([c for c in condition_keywords if c in text]) or None

    def remove_detected_conditions(text, conditions):
        if not conditions:
            return text
        for cond in conditions.split(', '):
            text = text.replace(cond, '')
        return text.strip()

    df_cleaned['Condition'] = df_cleaned['Cleaned_Text'].apply(extract_all_conditions)
    df_cleaned['Cleaned_Text'] = df_cleaned.apply(
        lambda row: remove_detected_conditions(row['Cleaned_Text'], row['Condition']), axis=1)

    def extract_date_fixed(text):
        patterns = [
            r'\b(0?[1-9]|1[0-2])[/\-\.](19[0-9]{2}|20[0-4][0-9]|2050)\b',
            r'\b(19[0-9]{2}|20[0-4][0-9]|2050)[/\-\.](0?[1-9]|1[0-2])\b',
            r'\b[yY][\s\-]?(19[0-9]{2}|20[0-4][0-9]|2050)\b',
            r'\b(19[0-9]{2}|20[0-4][0-9]|2050)[yY]\b',
            r'\b(19[0-9]{2}|20[0-4][0-9]|2050)\b',
            r'\b([1-2][0-9])[yY]\b',
            r'\b(0?[1-9]|1[0-2])\/(2[0-9])\b',
            r'(?<=\s)/2[0-9](?=\s|$)',
            r'\b(?:year)?(20[0-4][0-9]|19[0-9]{2}|2050|2[0-9])(?:year)?\b'
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

    def extract_price_and_remove(text):
        patterns = [
            r'\$\s?\d{1,3}(?:[.,]?\d{3})*(?:\.\d+)?\s?[kKmM]?',
            r'\b\d+(?:[.,]\d+)?\s?[kKmM]\b',
            r'\b\d{1,3}(?:[.,]\d{3})+\b',
            r'\b\d{3,}\b'
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0), text.replace(match.group(0), '')
        return None, text

    extracted_prices = df_cleaned['Cleaned_Text'].apply(extract_price_and_remove)
    df_cleaned['Price'] = extracted_prices.apply(lambda x: x[0])
    df_cleaned['Cleaned_Text'] = extracted_prices.apply(lambda x: x[1].strip())

    set_keywords = ["full set", "fullset", "full", "naked", "watch only", "only watch", "set", "set only", "setonly", "set watch", "setwatch", "watch set", "watchset", "full links"]
    set_pattern = r'\b(?:' + '|'.join(re.escape(word) for word in set_keywords) + r')\b'

    df_cleaned['Set'] = df_cleaned['Cleaned_Text'].apply(
        lambda text: (m := re.search(set_pattern, text)) and m.group(0)
    )
    df_cleaned['Cleaned_Text'] = df_cleaned.apply(
        lambda row: re.sub(re.escape(str(row['Set'])), '', row['Cleaned_Text']).strip()
        if row['Set'] else row['Cleaned_Text'], axis=1)

    color_keywords = [
        "black", "white", "silver", "gold", "yellow", "green", "blue", "red", "pink", "gray", "grey", "brown",
        "chocolate", "champagne", "rose", "olive", "jade", "pistachio", "diamond", "snow", "salmon", "orange",
        "beige", "cream", "ivory", "bronze", "copper", "purple", "turquoise", "navy", "khaki", "pearl", "plum",
        "teal", "camel", "sand", "taupe", "gunmetal", "coral", "aubergine", "lilac", "lavender", "fuchsia",
        "mocha", "coffee", "sapphire", "ruby", "emerald", "cobalt", "onyx", "caramel", "floral", "candy",
        "rainbow", "choco", "ceramic", "carbon", "diamon", "ice", "iceblue", "leather", "smoke", "steel",
        "titanium", "titan", "aluminium", "aluminum", "platinum", "pewter", "brass", "graphite", "charcoal",
        "mint", "citrus", "nowhite", "ombre", "flower", "pistschio", "foggy", "dark", "night", "midnight", "cele",
        "celestial", "sunset", "sunrise", "dawn", "dusk", "twilight", "stormy", "cloudy", "rainy", "shiny",
        "celebration", "tiffany", "celc", "tifffany", "tifany", "celcb", "tiff", "pis", "biack", "blac", "blck",
        "blac", "blck", "blackk", "whit", "whitte", "silv", "golden", "yello", "greeen", "bluue", "ls", "blk",
        "pistachio", "pistschio"
    ]
    modifiers = ["light", "dark", "foggy", "matte", "bright", "deep", "dusty", "hot", "baby", "smoky", "midnight", "royal"]
    composite_colors = [f"{mod} {col}" for mod in modifiers for col in color_keywords]
    full_color_list = composite_colors + color_keywords

    def extract_all_colors(text):
        found_colors = set()
        for color in full_color_list:
            # Asegura que el color esté aislado como palabra o sufijo/prefijo separado
            if re.search(rf'\b{re.escape(color)}\b', text):
                found_colors.add(color)
        return ", ".join(sorted(found_colors)) if found_colors else None

    def remove_detected_colors(text, colors):
        if not colors:
            return text
        for c in colors.split(', '):
            text = re.sub(rf'\b{re.escape(c)}\b', '', text)
        return text.strip()

    df_cleaned['Color'] = df_cleaned['Cleaned_Text'].apply(extract_all_colors)
    df_cleaned['Cleaned_Text'] = df_cleaned.apply(
        lambda row: remove_detected_colors(row['Cleaned_Text'], row['Color']), axis=1)

    df_cleaned['Cleaned_Text'] = df_cleaned['Cleaned_Text'].apply(lambda text: ' '.join(
        word for word in text.split() if not re.fullmatch(r'[^a-zA-Z0-9]+', word)
    ))

    def normalize_date_extended(value):
        if not isinstance(value, str):
            return None
        original = value
        value = value.lower().replace("year", "").replace("y", "").strip().replace(".", "/")
        if re.search(r'/\d{2}$', value):
            match = re.search(r'/(\d{2})$', value)
            if match:
                return f"20{match.group(1)}"
        match = re.match(r'^(0?[1-9]|1[0-2])[\/\-](\d{2,4})$', value)
        if match:
            m, y = match.groups()
            y = '20' + y if len(y) == 2 else y
            return f"{int(y):04d}-{int(m):02d}"
        match = re.match(r'^(\d{4})[\/\-](0?[1-9]|1[0-2])$', value)
        if match:
            y, m = match.groups()
            return f"{int(y):04d}-{int(m):02d}"
        match = re.match(r'^(20[0-4][0-9]|2050|19[0-9]{2})$', value)
        if match:
            return match.group(0)
        match = re.match(r'^\d{2}$', value)
        if match:
            return f"20{value}"
        return original

    df_cleaned['Date'] = df_cleaned['Date'].apply(normalize_date_extended)

    def clean_price_final(price):
        if not isinstance(price, str):
            return price
        price = price.lower().replace('$', '').replace(',', '')

        match = re.match(r'^(\d+)[\.,](\d{1,3})m$', price)
        if match:
            millions, thousands = match.groups()
            return str(int(millions) * 1_000_000 + int(thousands) * 1_000)

        match = re.match(r'^(\d+)[\.,](\d)m$', price)
        if match:
            whole, decimal = match.groups()
            return str(int(whole) * 1_000_000 + int(decimal) * 100_000)

        match = re.match(r'^(\d+)m$', price)
        if match:
            return str(int(match.group(1)) * 1_000_000)

        match = re.match(r'^(\d+)k$', price)
        if match:
            return str(int(match.group(1)) * 1_000)

        return re.sub(r'[^\d]', '', price)

    df_cleaned['Price'] = df_cleaned['Price'].apply(clean_price_final)
    df_cleaned['Price'] = df_cleaned['Price'].apply(
        lambda x: str(int(x) * 1000) if isinstance(x, str) and x.isdigit() and len(x) == 3 else x
    )

    df_cleaned = df_cleaned[
        df_cleaned['Cleaned_Text'].apply(lambda x: len(re.sub(r'\D', '', x)) >= 4 and len(str(x)) <= 50)
    ]

    df_cleaned.rename(columns={"Cleaned_Text": "Reference"}, inplace=True)
    df_cleaned.reset_index(drop=True, inplace=True)
    df_cleaned = df_cleaned.drop_duplicates()
    
    # === Eliminar palabras adicionales del campo Reference
    def remove_extra_terms(text):
        for word in ["oys", "jub", "jubilee", "any", "available"]:
            text = re.sub(re.escape(word), '', text)
        return text.strip()

    df_cleaned['Reference'] = df_cleaned['Reference'].apply(remove_extra_terms)

    return df_cleaned
