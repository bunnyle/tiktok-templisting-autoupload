#!/usr/bin/env bash
# 用法：
#   export TTF_API=https://ttf-license.<你的子域>.workers.dev   TTF_ADMIN=<你的 ADMIN_KEY>
#   ./admin.sh create monthly 30 5 "備註"     # 月費碼 30 天 x5 個
#   ./admin.sh create lifetime 0 1 "買斷"     # 買斷碼 x1
#   ./admin.sh list | revoke CODE | extend CODE 30 | kick CODE | devices CODE
set -e
c() { curl -s -X POST "$TTF_API/admin/$1" -H "authorization: Bearer $TTF_ADMIN" -H 'content-type: application/json' -d "$2"; echo; }
case "$1" in
  create) c create "{\"plan\":\"$2\",\"days\":$3,\"count\":$4,\"note\":\"$5\"}";;
  list) curl -s "$TTF_API/admin/list" -H "authorization: Bearer $TTF_ADMIN"; echo;;
  revoke) c revoke "{\"code\":\"$2\"}";;
  extend) c extend "{\"code\":\"$2\",\"days\":$3}";;
  kick) c kick "{\"code\":\"$2\"}";;
  devices) c devices "{\"code\":\"$2\"}";;
  *) sed -n 2,8p "$0";;
esac
