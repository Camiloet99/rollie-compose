# cleaner_spark_v2.py
import os
import re
import pandas as pd
from typing import Union, List, Dict

from pyspark.sql import DataFrame as SparkDF
from pyspark.sql import functions as F
from pyspark.sql.functions import (
    regexp_replace, regexp_extract, trim, col, split, lower, asc, length, when, size,
    coalesce, expr, lit, to_date, concat_ws, lpad, udf, round as spark_round,
    array  # <- importante para tokens como arreglo
)
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType
)

# =========================================================
# Helpers (misma interfaz que tu script viejo)
# =========================================================

def _to_codes_sparkdf(
    spark,
    codes_source: Union[str, SparkDF, pd.DataFrame, List[Dict], List[List[str]]]
) -> SparkDF:
    """
    Acepta:
      - str: nombre de tabla Spark ("workspace.default.brand_codes")
      - SparkDF: con columnas ["Brand", "ref_code_lo"]
      - pd.DataFrame: con columnas ["Brand", "ref_code_lo"]
      - list[dict]: cada dict {"Brand":..., "ref_code_lo":...}
      - list[list]: cada item [Brand, ref_code_lo]
    """
    if isinstance(codes_source, str):
        df = spark.read.table(codes_source)
        return df.select("Brand", "ref_code_lo")

    if isinstance(codes_source, SparkDF):
        return codes_source.select("Brand", "ref_code_lo")

    if isinstance(codes_source, pd.DataFrame):
        return spark.createDataFrame(codes_source[["Brand", "ref_code_lo"]])

    if isinstance(codes_source, list):
        if len(codes_source) == 0:
            return spark.createDataFrame(pd.DataFrame(columns=["Brand", "ref_code_lo"]))
        if isinstance(codes_source[0], dict):
            df = pd.DataFrame(codes_source, columns=["Brand", "ref_code_lo"])
        else:
            df = pd.DataFrame(codes_source, columns=["Brand", "ref_code_lo"])
        return spark.createDataFrame(df)

    raise ValueError("codes_source inválido: usa str (tabla), SparkDF, pd.DataFrame, list[dict] o list[list]")


def _read_csv_as_spark_df(spark, input_path: str) -> SparkDF:
    """
    Lectura de CSV (solo CSV).
    Genera: filename, fecha, raw_text (con fecha extraída del nombre: MM_DD_YY).
    """
    filename = os.path.basename(input_path)

    df = spark.read.csv(input_path, header=False, inferSchema=False)
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
    return df

# =========================================================
# Regex (idéntico al notebook nuevo)
# =========================================================

regex_map = {
    "color": (r"\b(black|white|silver|gold|yellow|green|blue|red|pink|gray|grey|brown|chocolate|champagne|rose|olive|jade|pistachio|diamond|snow|salmon|orange|beige|cream|ivory|bronze|copper|purple|turquoise|navy|khaki|pearl|plum|teal|camel|sand|taupe|gunmetal|coral|aubergine|lilac|lavender|fuchsia|mocha|coffee|sapphire|ruby|emerald|cobalt|onyx|caramel|floral|candy|rainbow|choco|ceramic|carbon|diamon|ice|iceblue|leather|smoke|steel|titanium|titan|aluminium|aluminum|platinum|pewter|brass|graphite|charcoal|mint|citrus|nowhite|ombre|flower|pistschio|foggy|dark|night|midnight|cele|celestial|sunset|sunrise|dawn|dusk|twilight|stormy|cloudy|rainy|shiny|celebration|tiffany|celc|tifffany|tifany|celcb|tiff|pis|biack|blac|blck|blackk|whit|whitte|silv|golden|yello|greeen|bluue|ls|blk|champ|light|foggy|matte|bright|deep|dusty|hot|baby|smoky|royal|ng|wt|sundust|wg|choc|snowflake|camo|carnelian|adventurine|sliver|frost|aventuine|sun|omber|aventurine|bule|white mop|ombr|ce|cho|palm|turqoise|wht)\b", 1),
    "estado": (r"\b(n[0-9]+)\b", 1),
    "anio": (r"\b(19[0-9]{2}|20[0-9]{2})(y|year)?\b", 1),
    "fecha": (r"\b([0-9]{1,2}\/[0-9]{2,4}|[a-z]{3}-[0-9]{2,4})\b", 1),
    "precio_hkd": (r"\b("r"hkd\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?"
                    r"|\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?hkd"
                    r"|hk\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?"
                    r"|\$\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?hkd"
                    r")\b", 1),
    "Bracelet": (r"\b(oy|oys|oyst|oyster|jubilee|jub|pres|president|of|oysterflex|pm|pearl|pearlmaster|leather|le|lav)\b", 1),
    "precio_usd": (r"\b(?!(?:\d{4}-\d{1,2}|\d{1,2}-\d{4}|\d{2}-\d{2})\b)(?:\$)?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?[kKmM]?)\b(?=\s?-\d+)", 1),
    "precio_regex": (r"\b(?!(?:201[2-9]|202[0-9]|2030|\d{2}/\d{4}|\d{4}/\d{2}|\d{2}/\d{2}/\d{4}|\d{1}/\d{4}|\d{2}/\d{2})\b)(?:\$?\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmM]?|\$?\s?\d+(?:\.\d+)?[kKmM]?|hkd\s?\d+(?:\.\d+)?[kKmM]?|hk\s?\d+(?:\.\d+)?[kKmM]?|hdk\s?\d+(?:\.\d+)?[kKmM]?|\d+(?:\.\d+)?[kKmM]?\s?(?:hkd|hk|hdk))\b", 0),
    "condicion": (r"\b(without box|brand new|brand-new|brandnew|like new|like-new|likenew|like used|like-used|likeused|pre owned|pre-owned|preowned|used|new|unworn|mint|lnib|bnib|good condition|full links|double seal|nos|some sticker|full paved|paved|full|watch only|full stickers|full set|naked|only watch|fullset|new buckle|nsked|motif|card)\b", 1),
    "descuento": (r"-(\d+(?:\.\d+)?)", 1)
}

# =========================================================
# Normalizaciones (idénticas al notebook)
# =========================================================

color_map = {
    "aventurine":"aventurine","baby":"baby","beige":"beige","biack":"black","blk":"black","black":"black","blue":"blue",
    "bright":"bright","brown":"brown","bule":"blue","candy":"candy","carbon":"carbon","carnelian":"carnelian","ce":"celebration",
    "celc":"celebration","celcb":"celebration","cele":"celebration","celebration":"celebration","ceramic":"ceramic","champ":"champagne",
    "champagne":"champagne","cho":"chocolate","choc":"chocolate","choco":"chocolate","chocolate":"chocolate","coffee":"coffee",
    "coral":"coral","cream":"cream","dark":"dark","deep":"deep","diamond":"diamond","floral":"floral","flower":"floral","gold":"gold",
    "golden":"gold","greeen":"green","green":"green","grey":"grey","ice":"ice","iceblue":"blue","ivory":"ivory","khaki":"khaki",
    "lavender":"lavender","leather":"leather","ls":"leather","midnight":"midnight","mint":"mint","ng":"night","night":"night","null":None,
    "olive":"olive","omber":"ombre","ombr":"ombre","ombre":"ombre","onyx":"onyx","orange":"orange","pearl":"pearl","pink":"pink",
    "pis":"pistachio","pistachio":"pistachio","pistschio":"pistachio","platinum":"platinum","purple":"purple","rainbow":"rainbow",
    "red":"red","rose":"rose","ruby":"ruby","salmon":"salmon","sapphire":"sapphire","silver":"silver","sliver":"silver","smoke":"smoke",
    "snow":"snow","snowflake":"snow","steel":"steel","sun":"sun","sundust":"sun","tiff":"tiffany","tifffany":"tiffany","tiffany":"tiffany",
    "titan":"titanium","titanium":"titanium","turquoise":"turquoise","wg":"white","whit":"white","white":"white","wht":"white","wt":"white",
    "yellow":"yellow"
}
def normalize_color(color):
    if color is None:
        return None
    color_lower = color.lower().strip()
    return color_map.get(color_lower, color_lower)
normalize_color_udf = udf(normalize_color, StringType())

bracelet_map = {
    "bracelet":"unspecified","jub":"jubilee","jubilee":"jubilee","lav":"leather","of":"oysterflex","oys":"oyster","oyster":"oyster",
    "oysterflex":"oysterflex","president":"president","null":None
}
def normalize_Bracelet(Bracelet):
    if Bracelet is None:
        return None
    bracelet_lower = Bracelet.lower().strip()
    return bracelet_map.get(bracelet_lower, bracelet_lower)
normalize_Bracelet_udf = udf(normalize_Bracelet, StringType())

condition_map = {
    "bnib":"brand new","brand new":"brand new","brand-new":"brand new","brandnew":"brand new","card":"card","double seal":"double seal",
    "full":"full","full links":"full links","full paved":"paved","full set":"full set","full stickers":"full stickers","fullset":"full set",
    "good condition":"used","like new":"like new","like-new":"like new","likenew":"like new","like used":"used","like-used":"used",
    "likeused":"used","lnib":"like new","mint":"mint","motif":"motif","naked":"naked","new":"brand new","new buckle":"new buckle",
    "nos":"new old stock","nsked":"naked","only watch":"watch only","paved":"paved","pre owned":"used","pre-owned":"used","preowned":"used",
    "some sticker":"some sticker","unworn":"unworn","used":"used","watch only":"watch only","without box":"without box","null":None
}
def normalize_condicion(condicion):
    if condicion is None:
        return None
    condicion_lower = condicion.lower().strip()
    return condition_map.get(condicion_lower, condicion_lower)
normalize_condicion_udf = udf(normalize_condicion, StringType())

# =========================================================
# Pipeline principal (misma lógica del notebook, optimizada contra Janino)
# =========================================================

def process_watch_data_spark(
    spark,
    input_path: str,                # ruta al archivo CSV
    codes_source: Union[str, SparkDF, pd.DataFrame, List[Dict], List[List[str]]],
    return_type: str = "spark"      # "spark" o "pandas"
):
    # --- Lectura input (CSV) ---
    df = _read_csv_as_spark_df(spark, input_path)

    # --- limpieza & tokens > 2 (idéntico al notebook) ---
    df_clean = df.withColumn(
        "clean_text",
        lower(trim(regexp_replace(col("raw_text"), r"[^a-zA-Z0-9\s\$\.,/-]", "")))
    ).drop("raw_text")

    df_clean = (
        df_clean
        .filter((col("clean_text") != "") & (col("clean_text") != "-") & (col("clean_text") != "."))
        .withColumn("clean_text", regexp_replace(col("clean_text"), "- ", ""))
        .withColumn("clean_text", regexp_replace(col("clean_text"), "--", ""))
        .filter(~col("clean_text").startswith("$") & ~col("clean_text").startswith("---"))
        .withColumn("longitud", length(col("clean_text")))
        .withColumn("num_tokens", size(split(col("clean_text"), r"\s+")))
        .filter(col("num_tokens") > 2)
    )

    # --- Proceso 1era parte (idéntico): split dinámico en Pandas ---
    df_clean_pd = df_clean.toPandas()
    df_clean_pd["clean_text"] = (
        df_clean_pd["clean_text"].astype(str)
        .str.replace(r"[^a-zA-Z0-9\s\$\.,/-]", "", regex=True)
        .str.strip()
    )

    split_df = df_clean_pd["clean_text"].str.split(expand=True)
    df_clean_pd = pd.concat([df_clean_pd, split_df], axis=1)

    # Crear SparkDF de vuelta y ordenar/renombrar modelo
    df_spark = spark.createDataFrame(df_clean_pd)
    df_spark = (
        df_spark
        .filter(~col("clean_text").isin(["-", "", ".breguet", ".omega", "//"]))
        .withColumn("clean_text", regexp_replace(col("clean_text"), "^-", ""))
        .withColumnRenamed("0", "modelo")
        .orderBy(asc("clean_text"))
    )

    # --- JOIN brand_codes (idéntico) ---
    codes = _to_codes_sparkdf(spark, codes_source)
    df_join = (
        df_spark.join(codes, df_spark["modelo"] == codes["ref_code_lo"], "inner")
        .select(
            col("fecha"),
            df_spark["clean_text"],
            col("ref_code_lo"),
            col("Brand"),
            col("modelo"),
            col("num_tokens"),
            col("1"), col("2"), col("3"), col("4"), col("5"),
            col("6"), col("7"), col("8"), col("9"), col("10")
        )
    )

    # --- Proceso 2da parte (OPTIMIZADO): usar array + filter para evitar *_1..*_10 ---
    def _escape_for_sql_regex(pat: str) -> str:
        # Escapar para meter el patrón en una cadena SQL dentro de expr (RLIKE)
        return pat.replace("\\", "\\\\").replace("'", "\\'")

    token_cols = [col(str(i)) for i in range(1, 11)]
    df_tokens = (
        df_join
        .filter(col("num_tokens").isin([3,4,5,6,7,8,9,10]))
        .withColumnRenamed("fecha", "fecha_archivo")
        .withColumn("tokens", array(*token_cols))
    )

    for col_name, (pattern, group) in regex_map.items():
        pat_sql = _escape_for_sql_regex(pattern)
        cand = f"__cand_{col_name}"
        # Primer token que matchee el patrón
        df_tokens = df_tokens.withColumn(
            cand,
            expr(f"element_at(filter(tokens, x -> x RLIKE '{pat_sql}'), 1)")
        )
        # Extrae el grupo solo si existe candidate
        df_tokens = df_tokens.withColumn(
            col_name,
            when(col(cand).isNotNull(), regexp_extract(col(cand), pattern, group)).otherwise(None)
        ).drop(cand)

    # Selección de columnas resultantes (ya no usamos "1".."10" ni "tokens")
    df_tokens = df_tokens.select(
        "fecha_archivo", "clean_text", "Brand", "modelo", "num_tokens",
        *list(regex_map.keys())
    )

    # --- Estandarizaciones (idéntico) ---
    df_tokens = df_tokens.withColumn("color_normalized", normalize_color_udf(col("color"))) \
                         .drop("color") \
                         .withColumnRenamed("color_normalized", "color")

    df_tokens = df_tokens.withColumn("Bracelet_normalized", normalize_Bracelet_udf(col("Bracelet"))) \
                         .drop("Bracelet") \
                         .withColumnRenamed("Bracelet_normalized", "bracelet") \
                         .withColumnRenamed("Brand", "brand")

    df_tokens = df_tokens.withColumn("condicion_normalized", normalize_condicion_udf(col("condicion"))) \
                         .drop("condicion") \
                         .withColumnRenamed("condicion_normalized", "condicion")

    # Reglas de exclusión/precedencia de precios (idénticas)
    df_tokens = df_tokens.withColumn("precio_regex", when(col("precio_hkd").isNotNull(), lit(None)).otherwise(col("precio_regex")))
    df_tokens = df_tokens.withColumn("precio_hkd",  when(col("precio_regex").isNotNull(), lit(None)).otherwise(col("precio_hkd")))
    df_tokens = df_tokens.withColumn("precio_regex", when(col("precio_usd").isNotNull(), lit(None)).otherwise(col("precio_regex")))
    df_tokens = df_tokens.withColumn("precio_usd",  when(col("precio_hkd").isNotNull(), lit(None)).otherwise(col("precio_usd")))

    # --- Currency y montos (idéntico) ---
    df_tokens_2 = (
        df_tokens
        .withColumn("currency", lit("HKD"))
        .withColumn("precio", coalesce(col("precio_hkd"), col("precio_regex"), col("precio_usd")))
        .withColumn("precio_2", regexp_extract(col("precio"), r"([0-9\.,]+[kKmM]?)", 1))
        .withColumn("descuento", col("descuento").cast("float"))
    )

    final = (
        df_tokens_2
        .withColumn(
            "monto",
            when(col("precio_2").rlike("(?i)k"),
                 expr("try_cast(regexp_replace(precio_2, '(?i)k', '') as double)") * lit(1000))
            .when(col("precio_2").rlike("(?i)m"),
                 expr("try_cast(regexp_replace(precio_2, '(?i)m', '') as double)") * lit(1000000))
            .otherwise(expr("try_cast(regexp_replace(precio_2, '[,.]', '') as double)"))
        )
        .withColumn("monto_final", spark_round(col("monto") * (1 - col("descuento") / 100), 2))
        .withColumn("monto_final", when(col("monto_final").isNull(), col("monto")).otherwise(col("monto_final")))
        .select('fecha_archivo', 'clean_text', 'brand', 'modelo', 'currency', 'monto', 'descuento',
                'monto_final', 'estado', 'condicion','anio', 'bracelet', 'color')
        .drop_duplicates()
    )

    final_a = final.filter((col("monto_final").isNotNull()) & (col("monto_final") > 5000))
    final_b = final.filter((col("monto_final").isNotNull()) & (col("monto_final") < 5000) & (col("monto_final") > 22))

    # --- Proceso 3era parte: casos extraordinarios (idéntico) ---
    final_b = final_b.withColumn("parte1", regexp_extract("clean_text", r"n(\d+),(\d+)", 1))
    final_b = final_b.withColumn("parte2", regexp_extract("clean_text", r"n(\d+),(\d+)", 2))
    final_b = final_b.withColumn("extraido", concat_ws("", "parte1", "parte2"))
    final_b = final_b.withColumn("extraido", when(col("extraido") == '', lit(None)).otherwise(col("extraido")))
    final_b = final_b.withColumn("extraido2", regexp_extract("clean_text", r"\$(\d+)", 1))
    final_b = final_b.withColumn("extraido2", when(col("extraido2") == '', lit(None)).otherwise(col("extraido2")) * 1000)
    final_b = final_b.withColumn("monto", coalesce(col("extraido"), col("extraido2")))
    final_b = final_b.withColumn(
        "monto_final",
        when(col("monto").isNotNull(), spark_round(col("monto") * (1 - col("descuento") / 100), 2)).otherwise(col("monto"))
    ).select('fecha_archivo', 'clean_text', 'brand', 'modelo', 'currency', 'monto', 'descuento',
             'monto_final', 'estado', 'condicion','anio', 'bracelet', 'color') \
     .filter(col("monto").isNotNull())

    final_b = final_b.withColumn("monto_final", when(col("monto_final").isNull(), col("monto")).otherwise(col("monto_final")))

    # --- UNION ALL (idéntico) ---
    final_total = final_a.union(final_b)

    # --- Salida ---
    if return_type == "pandas":
        return final_total.toPandas()
    return final_total
