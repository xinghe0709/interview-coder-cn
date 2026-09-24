#!/bin/bash

cd "$(dirname "$0")" || exit 1
pid_file="$PWD/.dev-server.pid"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if [ -f "$pid_file" ]; then
  running_pid=$(cat "$pid_file")
  if [[ "$running_pid" =~ ^[0-9]+$ ]] && ps -p "$running_pid" -o command= 2>/dev/null | grep -Fq '开启.command'; then
    echo '开发版已经在运行。'
    exit 0
  fi
  rm -f "$pid_file"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo '未找到 npm，请先安装 Node.js。'
  exit 1
fi

if [ ! -d node_modules ]; then
  echo '缺少依赖，请先在项目目录运行 npm install。'
  exit 1
fi

echo $$ > "$pid_file"

stop_tree() {
  local parent_pid="$1"
  local child_pid
  for child_pid in $(pgrep -P "$parent_pid" 2>/dev/null); do
    stop_tree "$child_pid"
  done
  kill -TERM "$parent_pid" 2>/dev/null || true
}

cleanup() {
  trap - EXIT HUP INT TERM
  if [ -n "${dev_pid:-}" ]; then
    stop_tree "$dev_pid"
    wait "$dev_pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
}

trap cleanup EXIT
trap 'exit 0' HUP INT TERM

echo '正在启动开发版；保持此窗口打开，或双击「关闭.command」停止。'
npm run dev &
dev_pid=$!
wait "$dev_pid"
