package expo.modules.skallglass

import android.annotation.TargetApi
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs
import kotlin.math.max

// skall's liquid glass: the screen behind (a GlassTargetView, found by its id) drawn under this
// view, softly blurred, then bent through a rounded lens: near the rim what lies just outside is
// drawn in, its colours split a little, and the rim catches the light from the top left (Android
// 13 and later, an AGSL shader). Android 12 blurs only. Below 12 the view draws nothing and the
// caller draws its solid ground instead.
class LiquidGlassView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var targetId: String? = null
    set(value) {
      if (field == value) return
      field = value
      invalidate()
    }
  var ground: Int? = null
    set(value) {
      field = value
      invalidate()
    }

  private val density = resources.displayMetrics.density
  private var cornerRadius = 0f
  private var blur = 0f
  private var refraction = 0f
  private var depth = 0f
  private var dispersion = 0f
  private var highlight = 0f

  private val glass: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) RenderNode("skallGlass") else null
  private var effectKey: List<Float>? = null
  private var watched: GlassTargetView? = null
  private val here = IntArray(2)
  private val there = IntArray(2)

  init {
    setWillNotDraw(false)
  }

  fun setCornerRadiusDp(dp: Float) = update { cornerRadius = dp * density }
  fun setBlurDp(dp: Float) = update { blur = dp * density }
  fun setRefractionDp(dp: Float) = update { refraction = dp * density }
  fun setDepthDp(dp: Float) = update { depth = dp * density }
  fun setDispersion(value: Float) = update { dispersion = value }
  fun setHighlight(value: Float) = update { highlight = value }

  private inline fun update(change: () -> Unit) {
    change()
    effectKey = null
    invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    GlassTargets.watch(this)
  }

  override fun onDetachedFromWindow() {
    GlassTargets.unwatch(this)
    watch(null)
    glass?.discardDisplayList()
    super.onDetachedFromWindow()
  }

  private fun watch(target: GlassTargetView?) {
    if (watched === target) return
    watched?.removeGlass(this)
    watched = target
    target?.addGlass(this)
  }

  private val sampledHere = IntArray(2)

  // Whether a change in this window area shows in the glass: its box with what it bends in.
  fun samples(area: Rect): Boolean {
    if (!isAttachedToWindow || width <= 0 || height <= 0) return true
    getLocationInWindow(sampledHere)
    val margin = max(abs(refraction) + blur, 1f).toInt() + 1
    return Rect.intersects(
      area,
      Rect(
        sampledHere[0] - margin,
        sampledHere[1] - margin,
        sampledHere[0] + width + margin,
        sampledHere[1] + height + margin,
      ),
    )
  }

  private var draws = 0

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    draws++
    if (draws % 60 == 1) android.util.Log.i("SkallGlass", "glass onDraw #$draws")
    val node = glass ?: return
    val target = GlassTargets.find(targetId)
    watch(target)
    if (target == null || !target.isAttachedToWindow) return
    val content = target.content ?: return
    if (!canvas.isHardwareAccelerated || width <= 0 || height <= 0) return

    // What lies just outside the glass is bent in at its rim, so the glass draws a little more of
    // the screen than it covers: as far as the bending and the blur reach.
    val margin = max(refraction + blur, 1f).toInt() + 1
    val w = width + margin * 2
    val h = height + margin * 2
    getLocationInWindow(here)
    target.getLocationInWindow(there)
    node.setPosition(-margin, -margin, width + margin, height + margin)
    applyEffect(node, w, h, margin)
    val recording = node.beginRecording(w, h)
    try {
      recording.drawColor(ground ?: Color.TRANSPARENT)
      recording.translate(
        (margin - (here[0] - there[0])).toFloat(),
        (margin - (here[1] - there[1])).toFloat(),
      )
      recording.drawRenderNode(content)
    } finally {
      node.endRecording()
    }
    canvas.drawRenderNode(node)
  }

  @TargetApi(Build.VERSION_CODES.S)
  private fun applyEffect(node: RenderNode, w: Int, h: Int, margin: Int) {
    val key = listOf(
      w.toFloat(), h.toFloat(), margin.toFloat(), cornerRadius, blur, refraction, depth, dispersion,
      highlight,
    )
    if (key == effectKey) return
    effectKey = key
    // A blur radius in pixels; Android takes it as Skia does (deviation 0.57735 × radius + 0.5).
    val blurred =
      if (blur > 0f) RenderEffect.createBlurEffect(blur, blur, Shader.TileMode.CLAMP) else null
    val effect = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val lens = lens(w, h, margin)
      if (blurred != null) RenderEffect.createChainEffect(lens, blurred) else lens
    } else {
      blurred
    }
    node.setRenderEffect(effect)
  }

  @TargetApi(Build.VERSION_CODES.TIRAMISU)
  private fun lens(w: Int, h: Int, margin: Int): RenderEffect {
    val shader = RuntimeShader(LENS)
    val half = floatArrayOf((w - margin * 2) / 2f, (h - margin * 2) / 2f)
    shader.setFloatUniform("origin", margin.toFloat(), margin.toFloat())
    shader.setFloatUniform("extent", half[0], half[1])
    shader.setFloatUniform("radius", minOf(cornerRadius, half[0], half[1]))
    shader.setFloatUniform("depth", max(depth, 1f))
    shader.setFloatUniform("strength", refraction)
    shader.setFloatUniform("dispersion", dispersion)
    shader.setFloatUniform("highlight", highlight)
    shader.setFloatUniform("px", density)
    return RenderEffect.createRuntimeShaderEffect(shader, "content")
  }

  private companion object {
    // The lens. `d` is the distance to the glass's rounded edge (negative inside); within `depth`
    // of the edge the glass curves down like a drop's rim, so what is drawn there comes from
    // further out (strongest at the edge), the red a little further and the blue a little less.
    // A thin band at the rim takes the light: most on the side facing the top left, a little on
    // the far side. Outside the edge nothing is drawn (smoothed over a pixel).
    const val LENS = """
      uniform shader content;
      uniform float2 origin;
      uniform float2 extent;
      uniform float radius;
      uniform float depth;
      uniform float strength;
      uniform float dispersion;
      uniform float highlight;
      uniform float px;

      float edge(float2 p) {
        float2 q = abs(p) - extent + radius;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
      }

      half4 main(float2 coord) {
        float2 p = coord - origin - extent;
        float d = edge(p);
        float cover = clamp(0.5 - d, 0.0, 1.0);
        if (cover <= 0.0) return half4(0.0);
        // Deep inside: no bend, no light, nothing split; the blurred screen as it is (the same
        // colour the full path gives there, without its work).
        if (d < -max(depth, 7.0 * px) - 1.0) return content.eval(coord);

        float2 n = float2(edge(p + float2(1.0, 0.0)) - edge(p - float2(1.0, 0.0)),
                          edge(p + float2(0.0, 1.0)) - edge(p - float2(0.0, 1.0)));
        float len = length(n);
        n = len > 0.0001 ? n / len : float2(0.0);

        float rim = clamp(1.0 + d / depth, 0.0, 1.0);
        float2 off = n * (rim * rim * strength);
        half4 col = content.eval(coord + off);
        if (dispersion > 0.0) {
          col.r = content.eval(coord + off * (1.0 + dispersion)).r;
          col.b = content.eval(coord + off * (1.0 - dispersion)).b;
        }

        float band = clamp(1.0 + d / (1.6 * px), 0.0, 1.0);
        float glow = clamp(1.0 + d / (7.0 * px), 0.0, 1.0);
        float facing = dot(n, normalize(float2(-0.55, -0.83)));
        float light = band * (0.75 * max(facing, 0.0) + 0.3 * max(-facing, 0.0))
                    + glow * glow * 0.18 * max(facing, 0.0);
        col.rgb = min(col.rgb + half3(highlight * light) * col.a, col.a);
        return col * cover;
      }
    """
  }
}
