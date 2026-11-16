/** Software renderers: Chrome's SwiftShader (also headless Chrome), Mesa's llvmpipe, Windows' fallback. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i

const checked: { webgl?: boolean; webgl2?: boolean } = {}

/**
 * WebGL on a real GPU, for the WebGL canvases (SiteBackground, PhotoDither). Without
 * one (no GPU, a blocklisted driver, many VMs) a shader runs on the CPU and makes the
 * whole page stutter: those visitors keep the plain page. failIfMajorPerformanceCaveat
 * catches some of them; Chrome still hands out a SwiftShader context, so check the
 * name too. (Read here only, never sent anywhere.) Checked once per page load.
 *
 * `webgl2` for shaders written for WebGL 2 (`#version 300 es`).
 */
export function hasGpuWebGL(type: 'webgl' | 'webgl2' = 'webgl'): boolean {
  const known = checked[type]
  if (known !== undefined) return known
  let ok = false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext(type, { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      ok = !SOFTWARE_RENDERER.test(renderer)
    }
  } catch {
    ok = false
  }
  checked[type] = ok
  return ok
}
