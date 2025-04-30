function log(message: string, logs?: string[]): void {
  const msg = `[${new Date().toISOString()}] ${message}`
  logs?.push(msg)
  console.log(msg)
}

async function runTask({
  name,
  task,
  logs
}: {
  name: string
  task: () => Promise<void>
  logs?: string[]
}): Promise<void> {
  log(`[开始] ${name}`, logs)
  try {
    await task()
    log(`[成功☑️] ${name}`, logs)
  } catch (error) {
    log(`[失败❌] ${name}`, logs)
    // 抛到外面
    throw error
  }
}

export { runTask }
