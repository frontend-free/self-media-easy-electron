async function runTask({ name, task }: { name: string; task: () => Promise<void> }): Promise<void> {
  console.log(`[开始] ${name}`)
  try {
    await task()
    console.log(`[成功] ${name}`)
  } catch (error) {
    console.error(`[失败] ${name}`, error)
    // 抛到外面
    throw error
  }
}

export { runTask }
