#!/bin/bash
# usage: lh.sh <base-url> <outdir> <preset: mobile|desktop> <route>...
BASE=$1; OUT=$2; PRESET=$3; shift 3
mkdir -p "$OUT"
for r in "$@"; do
  name=$(echo "$r" | tr '/#' '__' ); [ -z "$name" ] && name=home
  extra=""; [ "$PRESET" = desktop ] && extra="--preset=desktop"
  npx lighthouse "$BASE$r" $extra --quiet --chrome-flags="--headless=new --no-sandbox" \
     --only-categories=performance,accessibility,best-practices,seo,pwa \
     --output=json --output-path="$OUT/$PRESET$name.json" >/dev/null 2>&1
  node -e '
   const r=require(process.argv[1]); const c=r.categories, a=r.audits;
   const s=k=>c[k]?Math.round(c[k].score*100):"-";
   console.log([process.argv[2].padEnd(30), "perf",s("performance"),"a11y",s("accessibility"),"bp",s("best-practices"),"seo",s("seo"),
    "LCP",a["largest-contentful-paint"].displayValue,"TBT",a["total-blocking-time"].displayValue,"CLS",a["cumulative-layout-shift"].displayValue,
    "bytes",Math.round(a["total-byte-weight"].numericValue/1024)+"KiB"].join(" "));
  ' "$OUT/$PRESET$name.json" "$PRESET $r"
done
