import os
import re
import pandas as pd
from typing import Union, List, Dict, Optional

from pyspark.sql import DataFrame as SparkDF
from pyspark.sql import functions as F
from pyspark.sql.functions import (
    regexp_replace, regexp_extract, trim, col, split, lower, desc, asc, length, when, size,
    coalesce, expr, lit, to_date, concat_ws, lpad, udf, round as spark_round
)
from pyspark.sql.types import StringType

# -------------------------------------------------------------------
# 1) Helper: armar sparkDF "codes" desde varias fuentes
# -------------------------------------------------------------------
def _to_codes_sparkdf(spark, codes_source: Union[str, SparkDF, pd.DataFrame, List[Dict]] ) -> SparkDF:
    """
    Acepta:
    - str: nombre de tabla Spark (e.g. "workspace.default.brand_codes")
    - SparkDF: dataframe ya con columnas ["Brand", "ref_code_lo"]
    - pd.DataFrame: con columnas ["Brand", "ref_code_lo"]
    - list[dict]: cada dict con keys "Brand" y "ref_code_lo"
    """
    if isinstance(codes_source, str):
        # Interpretar como nombre de tabla
        df = spark.read.table(codes_source)
        return df.select("Brand", "ref_code_lo")
    elif isinstance(codes_source, SparkDF):
        return codes_source.select("Brand", "ref_code_lo")
    elif isinstance(codes_source, pd.DataFrame):
        return spark.createDataFrame(codes_source[["Brand", "ref_code_lo"]])
    elif isinstance(codes_source, list):
        df = pd.DataFrame(codes_source, columns=["Brand", "ref_code_lo"])
        return spark.createDataFrame(df)
    else:
        raise ValueError("codes_source debe ser: str (tabla), SparkDF, pd.DataFrame o list[dict] con Brand/ref_code_lo")

# -------------------------------------------------------------------
# 2) UDFs y mapas de normalización
# -------------------------------------------------------------------
color_map = {
    "aventurine": "aventurine","baby": "baby","beige": "beige","biack": "black","blk": "black","black": "black",
    "blue": "blue","bright": "bright","brown": "brown","bule": "blue","candy": "candy","carbon": "carbon",
    "carnelian": "carnelian","ce": "celebration","celc": "celebration","celcb": "celebration","cele": "celebration",
    "celebration": "celebration","ceramic": "ceramic","champ": "champagne","champagne": "champagne","cho": "chocolate",
    "choc": "chocolate","choco": "chocolate","chocolate": "chocolate","coffee": "coffee","coral": "coral","cream": "cream",
    "dark": "dark","deep": "deep","diamond": "diamond","floral": "floral","flower": "floral","gold": "gold","golden": "gold",
    "greeen": "green","green": "green","grey": "grey","ice": "ice","iceblue": "blue","ivory": "ivory","khaki": "khaki",
    "lavender": "lavender","leather": "leather","ls": "leather","midnight": "midnight","mint": "mint","ng": "night",
    "night": "night","null": None,"olive": "olive","omber": "ombre","ombr": "ombre","ombre": "ombre","onyx": "onyx",
    "orange": "orange","pearl": "pearl","pink": "pink","pis": "pistachio","pistachio": "pistachio","pistschio": "pistachio",
    "platinum": "platinum","purple": "purple","rainbow": "rainbow","red": "red","rose": "rose","ruby": "ruby","salmon": "salmon",
    "sapphire": "sapphire","silver": "silver","sliver": "silver","smoke": "smoke","snow": "snow","snowflake": "snow","steel": "steel",
    "sun": "sun","sundust": "sun","tiff": "tiffany","tifffany": "tiffany","tiffany": "tiffany","titan": "titanium",
    "titanium": "titanium","turquoise": "turquoise","wg": "white","whit": "white","white": "white","wht": "white","wt": "white",
    "yellow": "yellow"
}
def _normalize_color(c: Optional[str]) -> Optional[str]:
    if c is None:
        return None
    c = c.strip().lower()
    return color_map.get(c, c)
normalize_color_udf = udf(_normalize_color, StringType())

bracelet_map = {
    "bracelet": "unspecified","jub": "jubilee","jubilee": "jubilee","lav": "leather","of": "oysterflex","oys": "oyster",
    "oyster": "oyster","oysterflex": "oysterflex","president": "president","null": None
}
def _normalize_bracelet(b: Optional[str]) -> Optional[str]:
    if b is None:
        return None
    b = b.strip().lower()
    return bracelet_map.get(b, b)
normalize_bracelet_udf = udf(_normalize_bracelet, StringType())

condition_map = {
    "bnib": "brand new","brand new": "brand new","brand-new": "brand new","brandnew": "brand new","card": "card",
    "double seal": "double seal","full": "full","full links": "full links","full paved": "paved","full set": "full set",
    "full stickers": "full stickers","fullset": "full set","good condition": "used","like new": "like new","like-new": "like new",
    "likenew": "like new","like used": "used","like-used": "used","likeused": "used","lnib": "like new","mint": "mint","motif": "motif",
    "naked": "naked","new": "brand new","new buckle": "new buckle","nos": "new old stock","nsked": "naked","only watch": "watch only",
    "paved": "paved","pre owned": "used","pre-owned": "used","preowned": "used","some sticker": "some sticker","unworn": "unworn",
    "used": "used","watch only": "watch only","without box": "without box","null": None
}
def _normalize_condition(x: Optional[str]) -> Optional[str]:
    if x is None:
        return None
    x = x.strip().lower()
    return condition_map.get(x, x)
normalize_condition_udf = udf(_normalize_condition, StringType())

# -------------------------------------------------------------------
# 3) Regex map (idéntico al del script nuevo)
# -------------------------------------------------------------------
regex_map = {
    "color": (r"\b(black|white|silver|gold|yellow|green|blue|red|pink|gray|grey|brown|chocolate|champagne|rose|olive|jade|pistachio|diamond|snow|salmon|orange|beige|cream|ivory|bronze|copper|purple|turquoise|navy|khaki|pearl|plum|teal|camel|sand|taupe|gunmetal|coral|aubergine|lilac|lavender|fuchsia|mocha|coffee|sapphire|ruby|emerald|cobalt|onyx|caramel|floral|candy|rainbow|choco|ceramic|carbon|diamon|ice|iceblue|leather|smoke|steel|titanium|titan|aluminium|aluminum|platinum|pewter|brass|graphite|charcoal|mint|citrus|nowhite|ombre|flower|pistschio|foggy|dark|night|midnight|cele|celestial|sunset|sunrise|dawn|dusk|twilight|stormy|cloudy|rainy|shiny|celebration|tiffany|celc|tifffany|tifany|celcb|tiff|pis|biack|blac|blck|blackk|whit|whitte|silv|golden|yello|greeen|bluue|ls|blk|champ|light|foggy|matte|bright|deep|dusty|hot|baby|smoky|royal|ng|wt|sundust|wg|choc|snowflake|camo|carnelian|adventurine|sliver|frost|aventuine|sun|omber|aventurine|bule|white mop|ombr|ce|cho|palm|turqoise|wht)\b", 1),
    "estado": (r"\b(n[0-9]+)\b", 1),
    "anio": (r"\b(19[0-9]{2}|20[0-9]{2})(y|year)?\b", 1),
    "fecha": (r"\b([0-9]{1,2}\/[0-9]{2,4}|[a-z]{3}-[0-9]{2,4})\b", 1),
    "precio_hkd": (r"\b("r"hkd\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?|\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?hkd|hk\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?|\$\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?hkd"r")\b", 1),
    "Bracelet": (r"\b(oy|oys|oyst|oyster|jubilee|jub|pres|president|of|oysterflex|pm|pearl|pearlmaster|leather|le|lav)\b", 1),
    "precio_usd": (r"\b(?!(?:\d{4}-\d{1,2}|\d{1,2}-\d{4}|\d{2}-\d{2})\b)(?:\$)?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?[kKmM]?)\b(?=\s?-\d+)", 1),
    "precio_regex": (r"\b(?!(?:201[2-9]|202[0-9]|2030|\d{2}/\d{4}|\d{4}/\d{2}|\d{2}/\d{2}/\d{4}|\d{1}/\d{4}|\d{2}/\d{2})\b)(?:\$?\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?|\$?\s?\d+(?:\.\d+)?[kKmM]?|hkd\s?\d+(?:\.\d+)?[kKmM]?|hk\s?\d+(?:\.\d+)?[kKmM]?|hdk\s?\d+(?:\.\d+)?[kKmM]?|\d+(?:\.\d+)?[kKmM]?\s?(?:hkd|hk|hdk))\b", 0),
    "condicion": (r"\b(without box|brand new|brand-new|brandnew|like new|like-new|likenew|like used|like-used|likeused|pre owned|pre-owned|preowned|used|new|unworn|mint|lnib|bnib|good condition|full links|double seal|nos|some sticker|full paved|paved|full|watch only|full stickers|full set|naked|only watch|fullset|new buckle|nsked|motif|card)\b", 1),
    "descuento": (r"-(\d+(?:\.\d+)?)", 1)
}

# -------------------------------------------------------------------
# 4) Función principal: mismo flujo del script nuevo, pero parametrizado
# -------------------------------------------------------------------
def process_watch_data_spark(
    spark,
    input_source: Union[str, SparkDF],
    codes_source: Union[str, SparkDF, pd.DataFrame, List[Dict]],
    return_type: str = "spark"  # "spark" (default) o "pandas"
) -> Union[SparkDF, pd.DataFrame]:
    """
    Recibe:
      - input_source: ruta a CSV (sin header) o un Spark DataFrame con una columna de texto.
        Si es CSV: se asume una sola columna con el texto bruto (como _c0).
      - codes_source: catálogo Brand/ref_code_lo (str tabla | SparkDF | pd.DataFrame | list[dict]).
      - return_type: "spark" para SparkDF o "pandas" para pd.DataFrame.

    Retorna:
      - DataFrame con columnas limpias: 
        ['fecha_archivo','clean_text','brand','modelo','currency','monto','descuento',
         'monto_final','estado','condicion','anio','bracelet','color']
    """
    # -----------------------------
    # Lectura input
    # -----------------------------
    if isinstance(input_source, str):
        file_path = input_source
        filename = os.path.basename(file_path)
        df = spark.read.csv(file_path, header=False, inferSchema=False)
        # estandarizar: poner la col filename y fecha desde el nombre
        df = (
            df.withColumn("filename", lit(filename))
              .withColumn("raw_date", regexp_extract(col("filename"), r"(\d{1,2}_\d{1,2}_\d{2})", 1))
              .withColumn("raw_date", regexp_replace(col("raw_date"), "_", "-"))
              .withColumn("month", lpad(split(col("raw_date"), "-")[0], 2, "0"))
              .withColumn("day",   lpad(split(col("raw_date"), "-")[1], 2, "0"))
              .withColumn("year",  split(col("raw_date"), "-")[2])
              .withColumn("fecha_str", concat_ws("-", col("month"), col("day"), col("year")))
              .withColumn("fecha", to_date(col("fecha_str"), "MM-dd-yy"))
              .withColumnRenamed("_c0", "raw_text")
              .select("filename", "fecha", "raw_text")
              .drop_duplicates()
        )
    elif isinstance(input_source, SparkDF):
        # Intentar detectar la columna de texto
        cand = [c for c in input_source.columns if c.lower() in ("raw_text", "_c0")]
        if not cand:
            # si no, usar la primera
            src_col = input_source.columns[0]
        else:
            src_col = cand[0]
        df = (
            input_source
            .withColumnRenamed(src_col, "raw_text")
            .withColumn("filename", lit(None).cast("string"))
            .withColumn("fecha", lit(None).cast("date"))
            .select("filename","fecha","raw_text")
            .drop_duplicates()
        )
    else:
        raise ValueError("input_source debe ser ruta CSV (str) o Spark DataFrame")

    # -----------------------------
    # Limpieza base y filtros
    # -----------------------------
    df_clean = (
        df.withColumn("clean_text",
                      lower(trim(regexp_replace(col("raw_text"), r"[^a-zA-Z0-9\s\$\.,/-]", ""))))
          .drop("raw_text")
    )
    df_clean = (
        df_clean
        .filter( (col("clean_text") != "") & (col("clean_text") != "-") & (col("clean_text") != ".") )
        .withColumn("clean_text", regexp_replace(col("clean_text"), r"- ", ""))
        .withColumn("clean_text", regexp_replace(col("clean_text"), r"--", ""))
        .filter(~col("clean_text").startswith("$") & ~col("clean_text").startswith("---"))
        .withColumn("longitud", length(col("clean_text")))
        .withColumn("num_tokens", size(split(col("clean_text"), r"\s+")))
        .filter(col("num_tokens") > 2)
    )

    # -----------------------------
    # Split dinámico (misma técnica del script)
    # -----------------------------
    # NOTA: se usa Pandas temporalmente para el split expand
    df_clean_pd = df_clean.select("filename","fecha","clean_text","num_tokens").toPandas()
    df_clean_pd["clean_text"] = (
        df_clean_pd["clean_text"]
        .str.replace(r"[^a-zA-Z0-9\s\$\.,/-]", "", regex=True)
        .str.strip()
    )
    split_df = df_clean_pd["clean_text"].str.split(expand=True)
    df_clean_pd = pd.concat([df_clean_pd, split_df], axis=1)

    df_spark = spark.createDataFrame(df_clean_pd)
    df_spark = (
        df_spark
        .filter(~col("clean_text").isin(["-", "", ".breguet", ".omega", "//"]))
        .withColumn("clean_text", regexp_replace(col("clean_text"), r"^-", ""))
        .withColumnRenamed("0", "modelo")
        .orderBy(asc("clean_text"))
    )

    # -----------------------------
    # JOIN con codes
    # -----------------------------
    codes = _to_codes_sparkdf(spark, codes_source)
    df_join = (
        df_spark.join(codes, df_spark["modelo"] == codes["ref_code_lo"], "inner")
                .select(
                    col("fecha").alias("fecha"),
                    df_spark["clean_text"],
                    col("ref_code_lo"),
                    col("Brand"),
                    col("modelo"),
                    col("num_tokens"),
                    *[col(str(i)) for i in range(1, 11) if str(i) in df_spark.columns]
                )
    )

    # -----------------------------
    # Aplicar regex por token (1..10)
    # -----------------------------
    df_tokens = df_join.withColumnRenamed("fecha", "fecha_archivo")
    for col_name, (pattern, group) in regex_map.items():
        for i in range(1, 11):
            if str(i) in df_tokens.columns:
                new_col = f"{col_name}_{i}"
                df_tokens = df_tokens.withColumn(
                    new_col,
                    when(regexp_extract(col(str(i)), pattern, group) == "", None)
                    .otherwise(regexp_extract(col(str(i)), pattern, group))
                )

    # Colapsar primeras coincidencias
    all_cols = df_tokens.columns
    base_cols = sorted({c[:-2] for c in all_cols if re.search(r"_\d+$", c)})

    for base in base_cols:
        picks = [base + f"_{i}" for i in range(1, 11) if base + f"_{i}" in all_cols]
        if picks:
            df_tokens = df_tokens.withColumn(base, coalesce(*[col(p) for p in picks]))

    # Limpiar columnas intermedias *_i
    final_cols = [c for c in df_tokens.columns if not re.search(r"_\d+$", c)]
    df_tokens = df_tokens.select(*final_cols)

    # -----------------------------
    # Estandarizaciones
    # -----------------------------
    # color
    df_tokens = df_tokens.withColumn("color_normalized", normalize_color_udf(col("color"))) \
                         .drop("color") \
                         .withColumnRenamed("color_normalized", "color")

    # bracelet
    df_tokens = df_tokens.withColumn("Bracelet_normalized", normalize_bracelet_udf(col("Bracelet"))) \
                         .drop("Bracelet") \
                         .withColumnRenamed("Bracelet_normalized", "bracelet") \
                         .withColumnRenamed("Brand", "brand")

    # condición
    df_tokens = df_tokens.withColumn("condicion_normalized", normalize_condition_udf(col("condicion"))) \
                         .drop("condicion") \
                         .withColumnRenamed("condicion_normalized", "condicion")

    # Exclusiones de precio duplicado entre columnas (prioridades)
    df_tokens = df_tokens.withColumn("precio_regex", when(col("precio_hkd").isNotNull(), lit(None)).otherwise(col("precio_regex")))
    df_tokens = df_tokens.withColumn("precio_hkd",  when(col("precio_regex").isNotNull(), lit(None)).otherwise(col("precio_hkd")))
    df_tokens = df_tokens.withColumn("precio_regex", when(col("precio_usd").isNotNull(), lit(None)).otherwise(col("precio_regex")))
    df_tokens = df_tokens.withColumn("precio_usd",  when(col("precio_hkd").isNotNull(), lit(None)).otherwise(col("precio_usd")))

    # -----------------------------
    # Currency, monto y monto_final
    # -----------------------------
    df_tokens_2 = (
        df_tokens
        .withColumn("currency", lit("HKD"))
        .withColumn("precio", coalesce(col("precio_hkd"), col("precio_regex"), col("precio_usd")))
        .withColumn("precio_2", regexp_extract(col("precio"), r"([0-9\.,]+[kKmM]?)", 1))
        .withColumn("descuento", col("descuento").cast("float"))
    )

    final_a = (
        df_tokens_2
        .withColumn(
            "monto",
            when(col("precio_2").rlike("(?i)k"), expr("try_cast(regexp_replace(precio_2, '(?i)k', '') as double)") * lit(1000))
            .when(col("precio_2").rlike("(?i)m"), expr("try_cast(regexp_replace(precio_2, '(?i)m', '') as double)") * lit(1000000))
            .otherwise(expr("try_cast(regexp_replace(precio_2, '[,.]', '') as double)"))
        )
        .withColumn("monto_final", spark_round(col("monto") * (1 - col("descuento") / 100), 2))
        .withColumn("monto_final", when(col("monto_final").isNull(), col("monto")).otherwise(col("monto_final")))
        .select("fecha_archivo","clean_text","brand","modelo","currency","monto","descuento",
                "monto_final","estado","condicion","anio","bracelet","color")
        .drop_duplicates()
        .filter( (col("monto_final") > 5000) & col("monto_final").isNotNull() )
    )

    # Casos extraordinarios (monto bajo)
    final_b = (
        df_tokens_2
        .withColumn(
            "monto",
            lit(None).cast("double")  # placeholder; se sobreescribe luego
        )
        .select("fecha","clean_text","brand","modelo","currency","monto","descuento",
                "estado","condicion","anio","bracelet","color")
    )
    final_b = final_b.withColumnRenamed("fecha", "fecha_archivo")

    # Releer clean_text de df_tokens_2 para low-branch
    low_branch = (
        df_tokens_2
        .select("fecha","clean_text","brand","modelo","currency","descuento","estado","condicion","anio","bracelet","color")
        .withColumnRenamed("fecha", "fecha_archivo")
    )

    final_b = (
        low_branch
        .withColumn("parte1", regexp_extract(col("clean_text"), r"n(\d+),(\d+)", 1))
        .withColumn("parte2", regexp_extract(col("clean_text"), r"n(\d+),(\d+)", 2))
        .withColumn("extraido", concat_ws("", col("parte1"), col("parte2")))
        .withColumn("extraido", when(col("extraido") == '', lit(None)).otherwise(col("extraido")))
        .withColumn("extraido2", regexp_extract(col("clean_text"), r"\$(\d+)", 1))
        .withColumn("extraido2", when(col("extraido2") == '', lit(None)).otherwise(col("extraido2")) * lit(1000))
        .withColumn("monto", coalesce(col("extraido").cast("double"), col("extraido2").cast("double")))
        .withColumn("monto_final", when(col("monto").isNotNull(), spark_round(col("monto") * (1 - col("descuento") / 100), 2)).otherwise(col("monto")))
        .select("fecha_archivo","clean_text","brand","modelo","currency","monto","descuento",
                "monto_final","estado","condicion","anio","bracelet","color")
        .filter(col("monto").isNotNull())
    )

    # Filtro de bajos (22 < monto_final < 5000)
    final_b = final_b.filter( (col("monto_final") < 5000) & (col("monto_final") > 22) & col("monto_final").isNotNull() )

    # -----------------------------
    # UNION final
    # -----------------------------
    final_total = final_a.unionByName(final_b)

    # Output
    if return_type == "pandas":
        return final_total.toPandas()
    return final_total
