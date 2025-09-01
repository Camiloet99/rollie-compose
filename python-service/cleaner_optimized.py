import pandas as pd
import numpy as np
import re

def process_watch_data(file_path):
    # === Paso 0: Cargar archivo ===
    xls = pd.ExcelFile(file_path)
    df_raw = pd.read_excel(xls, sheet_name=xls.sheet_names[0])
    df_raw = df_raw.dropna(axis=1, how='all')
    df_raw = df_raw.iloc[:, 0].dropna().astype(str).reset_index(drop=True)
    df_cleaned = pd.DataFrame({'Raw_Text': df_raw})

    # === Paso 1-4: Limpieza inicial vectorizada ===
    df_cleaned['Cleaned_Text'] = (
        np.char.decode(np.char.encode(df_cleaned['Raw_Text'].str.lower().values.astype(str), encoding='ascii', errors='ignore'), encoding='ascii')
    )
    df_cleaned = pd.DataFrame(df_cleaned)
    df_cleaned['Cleaned_Text'] = df_cleaned['Cleaned_Text'].str.replace(r'[^\x00-\x7F]', '', regex=True)
    df_cleaned = df_cleaned[df_cleaned['Cleaned_Text'].str.len() > 15].reset_index(drop=True)
    df_cleaned = df_cleaned[~df_cleaned['Cleaned_Text'].str.contains(r'[\[\]]', regex=True)].reset_index(drop=True)

    # === Paso 5: Condiciones ===
    base_conditions = [
        "without box", "brand new", "brand-new", "brandnew", "like new", "like-new", "likenew",
        "like used", "like-used", "likeused", "pre owned", "pre-owned", "preowned", "used",
        "new", "unworn", "mint", "lnib", "bnib", "good condition", "full links", "double seal",
        "nos", "some sticker", "full paved", "paved", "full", "watch only", "full stickers", "full set",
        "naked", "only watch", "fullset", "new buckle", "nsked", "motif", "card"
    ]
    numeric_conditions = [f"n{i}" for i in range(1, 21)]
    condition_keywords = sorted(set(base_conditions + numeric_conditions), key=len, reverse=True)
    condition_pattern = re.compile(r'(?:' + '|'.join(map(re.escape, condition_keywords)) + r')')

    # Función optimizada para detectar y eliminar múltiples condiciones
    def extract_and_remove_conditions_batch(texts, pattern):
        matches = texts.apply(lambda x: pattern.findall(x))
        matches_cleaned = matches.apply(lambda x: ', '.join(sorted(set(x))) if x else None)
        cleaned_texts = texts.copy()
        cleaned_texts = cleaned_texts.apply(lambda x: pattern.sub(' ', x))  # reemplaza por espacio
        cleaned_texts = cleaned_texts.str.replace(r'\s{2,}', ' ', regex=True).str.strip()
        return matches_cleaned, cleaned_texts

    df_cleaned['Condition'], df_cleaned['Cleaned_Text'] = extract_and_remove_conditions_batch(df_cleaned['Cleaned_Text'], condition_pattern)

    # === Paso 6: Currency ===
    currency_list = ['hkd', 'usdt', 'usd', 'hk', 'kd']
    currency_pattern = re.compile(r'(?:' + '|'.join(currency_list) + r')(?=\d|\$|\s|$)')

    def extract_currency_and_remove(texts):
        currencies = []
        cleaned_texts = []
        for text in texts:
            match = currency_pattern.search(text)
            if match:
                currency = match.group(0)
                currencies.append(currency.upper())
                cleaned = text.replace(currency, ' ').strip()
                cleaned_texts.append(re.sub(r'\s{2,}', ' ', cleaned))
            else:
                currencies.append(None)
                cleaned_texts.append(text)
        return currencies, cleaned_texts

    df_cleaned['Currency'], df_cleaned['Cleaned_Text'] = extract_currency_and_remove(df_cleaned['Cleaned_Text'].tolist())

    # === Paso 7: Año ===
    year_patterns = [
        r'\b(0?[1-9]|1[0-2])[/\-\.](19[0-9]{2}|20[0-4][0-9]|2050)\b',
        r'\b(19[0-9]{2}|20[0-4][0-9]|2050)[/\-\.](0?[1-9]|1[0-2])\b',
        r'\by(19[0-9]{2}|20[0-4][0-9]|2050)\b',
        r'\b(19[0-9]{2}|20[0-4][0-9]|2050)y\b',
        r'\b(19[0-9]{2}|20[0-4][0-9]|2050)\b',
        r'\b(2[0-9])y\b',
        r'\by(2[0-9]{2,3})\b',
        r'\b(2[0-9]{2,3})y\b',
        r'\byear(20[0-4][0-9]|19[0-9]{2}|2050|2[0-9])\b',
        r'\b(20[0-4][0-9]|19[0-9]{2}|2050|2[0-9])year\b',
        r'(?:^|\s)/([2][0-9])(?:\s|$)'
    ]

    def extract_year_and_remove(texts, patterns):
        extracted_years = []
        cleaned_texts = []
        for text in texts:
            year = None
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    year = match.group(0)
                    text = text.replace(year, '').strip()
                    break
            extracted_years.append(year)
            cleaned_texts.append(re.sub(r'\s{2,}', ' ', text))
        return extracted_years, cleaned_texts

    df_cleaned['Year'], df_cleaned['Cleaned_Text'] = extract_year_and_remove(df_cleaned['Cleaned_Text'].tolist(), year_patterns)

    # === Paso 8: Colores (usando patrón conjunto optimizado) ===
    color_keywords = sorted([
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
        "blackk", "whit", "whitte", "silv", "golden", "yello", "greeen", "bluue", "ls", "blk", "champ",
        "light", "foggy", "matte", "bright", "deep", "dusty", "hot", "baby", "smoky", "royal", "ng", "wt", "sundust", "wg",
        "choc", "snowflake", "camo", "carnelian", "adventurine", "sliver", "frost", "aventuine", "sun", "omber", "aventurine",
        "bule", "white mop", "ombr", "ce", "cho", "palm", "turqoise"
    ], key=len, reverse=True)

    color_pattern = re.compile('|'.join(map(re.escape, color_keywords)))

    def extract_colors_and_remove(texts):
        matches_list = []
        cleaned_texts = []
        for text in texts:
            matches = color_pattern.findall(text)
            if matches:
                text_cleaned = color_pattern.sub('', text)
                text_cleaned = re.sub(r'\s{2,}', ' ', text_cleaned).strip()
                matches_list.append(', '.join(sorted(set(matches))))
                cleaned_texts.append(text_cleaned)
            else:
                matches_list.append(None)
                cleaned_texts.append(text.strip())
        return matches_list, cleaned_texts

    df_cleaned['Color'], df_cleaned['Cleaned_Text'] = extract_colors_and_remove(df_cleaned['Cleaned_Text'].tolist())

    # === Paso 9: Info extra ===
    info_keywords = sorted([
        "roma", "roman", "jub", "jubilee", "tbr", "rbr", "ln", "pave", "eisen", "eisenkiesel", "vi",
        "saru", "br", "vixi", "viix", "index", "oys", "oyster", "lb", "yml", "lv", "vtnr", "blnr",
        "blro", "grnr", "rom", "wim", "bc", "spider", "or", "skeleton", "50th", "150th", "qatar",
        "baguette", "mete", "meteor", "meteorite", "pada", "panda", "ntpt", "tpt", "jap", "mcl", "tag", "po",
        "fs", "fluted", "xi", "xi+", "hw"
    ], key=len, reverse=True)

    info_pattern = re.compile('|'.join(map(re.escape, info_keywords)))

    def extract_info_and_remove(texts):
        matches_list = []
        cleaned_list = []
        for text in texts:
            matches = info_pattern.findall(text)
            if matches:
                text_cleaned = text
                for kw in set(matches):
                    text_cleaned = text_cleaned.replace(kw, '')
                text_cleaned = re.sub(r'\s{2,}', ' ', text_cleaned).strip()
                matches_list.append(', '.join(sorted(set(matches))))
                cleaned_list.append(text_cleaned)
            else:
                matches_list.append(None)
                cleaned_list.append(text)
        return matches_list, cleaned_list

    df_cleaned['Info'], df_cleaned['Cleaned_Text'] = extract_info_and_remove(df_cleaned['Cleaned_Text'].tolist())

    # === Paso 10: Precio ===
    def extract_and_remove_price_optimized(series):
        prices = []
        cleaned = []

        for text in series:
            original = text

            # Paso 1: Sufijos k/m
            match = re.search(r'\b(\d+(?:[.,]\d+)?)([kKmM])\b', text)
            if match:
                value = float(match.group(1).replace(',', '.'))
                multiplier = 1_000 if match.group(2).lower() == 'k' else 1_000_000
                prices.append(str(int(value * multiplier)))
                cleaned.append(re.sub(re.escape(match.group(0)), '', text).strip())
                continue

            # Paso 2: Precio con $
            match = re.search(r'\$\s?(\d+(?:[,\.]?\d{3})*)', text)
            if match:
                prices.append(match.group(1).replace(',', '').replace('.', ''))
                cleaned.append(re.sub(r'\$\s?\d+(?:[,\.]?\d{3})*', '', text).strip())
                continue

            # Paso 3: Separadores como "," o "."
            match = re.search(r'(?<=\s)(\d{1,3}(?:[.,]\d{3})+)(?=\s|$)', text)
            if match and not re.search(r'[a-zA-Z]', match.group(0)):
                prices.append(match.group(0).replace(',', ''))
                cleaned.append(text.replace(match.group(0), '').strip())
                continue

            # Paso 4: Termina en 00
            match = re.search(r'(?<=\s)(\d*00)(?=\s|$)', text)
            if match:
                prices.append(match.group(0))
                cleaned.append(text.replace(match.group(0), '').strip())
                continue

            # Paso 5: Último número limpio
            match = re.findall(r'(?<=\s)(\d+)(?=\s|$)', text)
            if match:
                prices.append(match[-1])
                cleaned.append(text.replace(match[-1], '').strip())
                continue

            prices.append(None)
            cleaned.append(original)

        return prices, [re.sub(r'\s{2,}', ' ', t) for t in cleaned]

    # Aplicar función optimizada a los datos cargados
    df_cleaned['Price'], df_cleaned['Cleaned_Text'] = extract_and_remove_price_optimized(df_cleaned['Cleaned_Text'])

    df_cleaned = df_cleaned[df_cleaned['Price'].notnull()].reset_index(drop=True)
    df_cleaned.drop(columns=['Raw_Text'], inplace=True)

    df_cleaned['Cleaned_Text'] = df_cleaned['Cleaned_Text'].str.replace(r'\$', '', regex=True)

    df_cleaned = df_cleaned.rename(columns={'Cleaned_Text': 'Reference'})

    df_cleaned['Reference'] = df_cleaned['Reference'].apply(lambda x: ' '.join([w for w in x.split() if '%' not in w]))
    df_cleaned['Reference'] = df_cleaned['Reference'].str.replace(r'[,.]', '', regex=True)
    df_cleaned['Reference'] = df_cleaned['Reference'].str.replace(r'(?<!\w)/|/(?!\w)', '', regex=True)
    df_cleaned['Reference'] = df_cleaned['Reference'].str.replace(r'[\(\)]', '', regex=True)

    df_cleaned = df_cleaned[df_cleaned['Reference'].str.len() <= 50].reset_index(drop=True)
    df_cleaned = df_cleaned[df_cleaned['Reference'].notnull() & (df_cleaned['Reference'].str.strip() != '')].reset_index(drop=True)
    df_cleaned['Reference'] = df_cleaned['Reference'].str.strip()
    
    df_cleaned = df_cleaned.drop_duplicates().reset_index(drop=True)
    
    stop_words = [
        "available", "may", "june", "july", "august", "september", "october",
        "november", "december", "both", "hold", "not", "no#", "no"
    ]
    pattern_stop_words = re.compile(r'\b(?:' + '|'.join(map(re.escape, stop_words)) + r')\b', flags=re.IGNORECASE)

    df_cleaned['Reference'] = df_cleaned['Reference'].str.replace(pattern_stop_words, '', regex=True)
    df_cleaned['Reference'] = df_cleaned['Reference'].str.replace(r'\s{2,}', ' ', regex=True).str.strip()

    return df_cleaned
