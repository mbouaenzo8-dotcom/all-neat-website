import assert from 'node:assert/strict'
import test from 'node:test'
import { singleFlight } from './singleFlight.ts'

test('les appels concurrents partagent la même tâche asynchrone', async () => {
  let calls = 0
  let finish!: () => void
  const initialize = singleFlight(
    () =>
      new Promise<void>((resolve) => {
        calls++
        finish = resolve
      }),
  )

  const first = initialize()
  const second = initialize()
  assert.equal(first, second)

  await Promise.resolve()
  assert.equal(calls, 1)
  finish()
  await Promise.all([first, second])
  assert.equal(initialize(), first, 'la tâche résolue ne doit pas redémarrer')
  assert.equal(calls, 1)
})

test('une tâche en échec ne redémarre pas dans la même page', async () => {
  let calls = 0
  const initialize = singleFlight(async () => {
    calls++
    throw new Error('échec du modèle')
  })

  const first = initialize()
  const second = initialize()
  assert.equal(first, second)
  await assert.rejects(first, /échec du modèle/)
  await assert.rejects(initialize(), /échec du modèle/)
  assert.equal(calls, 1)
})
