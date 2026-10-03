import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const handsDirectory = fileURLToPath(new URL('../../public/hands/', import.meta.url))

const requiredAssets = [
  'hand_landmark_full.tflite',
  'hand_landmark_lite.tflite',
  'hands.binarypb',
  'hands_solution_packed_assets.data',
  'hands_solution_packed_assets_loader.js',
  'hands_solution_simd_wasm_bin.js',
  'hands_solution_simd_wasm_bin.wasm',
  'hands_solution_wasm_bin.js',
  'hands_solution_wasm_bin.wasm',
]

test('les modèles et moteurs MediaPipe nécessaires sont embarqués', () => {
  for (const asset of requiredAssets) {
    const size = statSync(join(handsDirectory, asset)).size
    assert.ok(size > 0, `${asset} doit être présent et non vide`)
  }

  // Le runtime SIMD tente aussi de charger ce marqueur vide : il doit exister.
  assert.equal(statSync(join(handsDirectory, 'hands_solution_simd_wasm_bin.data')).size, 0)
})
