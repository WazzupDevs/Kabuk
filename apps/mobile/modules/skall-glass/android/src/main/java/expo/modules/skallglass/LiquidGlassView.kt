package expo.modules.skallglass

import android.annotation.TargetApi
import android.content.Context
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Outline
import android.graphics.Rect
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.ceil
import kotlin.math.max

// skall's frosted glass (the owner's call, 29 Ekim: frosted instead of the liquid lens, everywhere
// the glass was): the screen behind (a GlassTargetView, found by its id) drawn under this view,
// blurred as CSS's backdrop-filter blurs (`blur` the deviation in dp, docs/design/aura's
// blur(24px)) and its colours made richer (`saturation`, saturate(170%)), cut to the view's rounded
// box. A strong blur keeps nothing small, so the screen is drawn small into the glass (an eighth
// of the size at most, as Telegram Android draws its frosted bars) before it is blurred: the same
// picture for a sixty-fourth of the work. Android 12 and later; below it the view draws nothing and
// the caller draws its solid ground instead.
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
  // The blur's deviation (CSS's blur length), in pixels.
  private var sigma = 0f
  private var saturation = 1f

  private val glass: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) RenderNode("skallGlass") else null
  // The glass drawn once into a layer of its own and kept: the system applies a RenderEffect
  // again every time its node is drawn on some GPUs (its cache is off there), which made the bar
  // blur on every frame anything on the screen moved. The layer is drawn again only when the glass
  // is (a change under it: GlassTargetView). It also cuts the glass to its rounded box.
  private val kept: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      RenderNode("skallGlassKept").apply { setUseCompositingLayer(true, null) }
    } else {
      null
    }
  private var effectKey: List<Float>? = null
  private var watched: GlassTargetView? = null
  private val here = IntArray(2)
  private val there = IntArray(2)
  private val outline = Outline()

  init {
    setWillNotDraw(false)
  }

  fun setCornerRadiusDp(dp: Float) = update { cornerRadius = dp * density }
  fun setBlurDp(dp: Float) = update { sigma = dp * density }
  fun setSaturation(value: Float) = update { saturation = value }

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
    kept?.discardDisplayList()
    super.onDetachedFromWindow()
  }

  private fun watch(target: GlassTargetView?) {
    if (watched === target) return
    watched?.removeGlass(this)
    watched = target
    target?.addGlass(this)
  }

  private val sampledHere = IntArray(2)

  // The blur reaches about three deviations out: what lies that far outside the glass is drawn in.
  private fun reach(): Int = ceil(max(sigma * REACH, 1f)).toInt() + 1

  // Whether a change in this window area shows in the glass: its box with what the blur draws in,
  // to two deviations (past that a change weighs a few per cent of the edge's colour; the glass does
  // not draw again for it).
  fun samples(area: Rect): Boolean {
    if (!isAttachedToWindow || width <= 0 || height <= 0) return true
    getLocationInWindow(sampledHere)
    val margin = ceil(max(sigma * SEEN, 1f)).toInt() + 1
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

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val node = glass ?: return
    val keep = kept ?: return
    val target = GlassTargets.find(targetId)
    watch(target)
    if (target == null || !target.isAttachedToWindow) return
    val content = target.content ?: return
    if (!canvas.isHardwareAccelerated || width <= 0 || height <= 0) return
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    drawFrost(canvas, node, keep, content, target)
  }

  @TargetApi(Build.VERSION_CODES.S)
  private fun drawFrost(
    canvas: Canvas,
    node: RenderNode,
    keep: RenderNode,
    content: RenderNode,
    target: GlassTargetView,
  ) {
    // The glass draws a little more of the screen than it covers, as far as the blur reaches.
    val margin = reach()
    val fullW = width + margin * 2
    val fullH = height + margin * 2
    // Small enough that the small picture's blur still spans a few pixels, never under an eighth.
    val scale = if (sigma > 0f) (SMALL_SIGMA_PX / sigma).coerceIn(MIN_SCALE, 1f) else 1f
    // The deviation in the small picture, as a radius (React Native's and Telegram's conversion:
    // deviation 0.57735 × radius + 0.5).
    val smallSigma = sigma * scale
    val radius = if (smallSigma > MIN_SIGMA_PX) (smallSigma - MIN_SIGMA_PX) / SIGMA_TO_RADIUS else 0f
    val w = ceil(fullW * scale).toInt().coerceAtLeast(1)
    val h = ceil(fullH * scale).toInt().coerceAtLeast(1)
    getLocationInWindow(here)
    target.getLocationInWindow(there)
    node.setPosition(0, 0, w, h)
    applyEffect(node, w, h, radius)
    val recording = node.beginRecording(w, h)
    try {
      recording.scale(scale, scale)
      ground?.let { recording.drawColor(it) }
      recording.translate(
        (margin - (here[0] - there[0])).toFloat(),
        (margin - (here[1] - there[1])).toFloat(),
      )
      recording.drawRenderNode(content)
    } finally {
      node.endRecording()
    }
    keep.setPosition(-margin, -margin, width + margin, height + margin)
    // Cut to the view's rounded box (in the kept layer's own place, which starts `margin` out).
    outline.setRoundRect(margin, margin, margin + width, margin + height, cornerRadius)
    keep.setOutline(outline)
    keep.setClipToOutline(true)
    val outer = keep.beginRecording(fullW, fullH)
    try {
      outer.scale(1f / scale, 1f / scale)
      outer.drawRenderNode(node)
    } finally {
      keep.endRecording()
    }
    canvas.drawRenderNode(keep)
  }

  @TargetApi(Build.VERSION_CODES.S)
  private fun applyEffect(node: RenderNode, w: Int, h: Int, radius: Float) {
    val key = listOf(w.toFloat(), h.toFloat(), radius, saturation)
    if (key == effectKey) return
    effectKey = key
    val blurred =
      if (radius > 0f) RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP) else null
    // CSS's saturate() after the blur (the filter list's order).
    val effect =
      if (saturation != 1f) {
        val matrix = ColorMatrixColorFilter(ColorMatrix().apply { setSaturation(saturation) })
        if (blurred != null) {
          RenderEffect.createColorFilterEffect(matrix, blurred)
        } else {
          RenderEffect.createColorFilterEffect(matrix)
        }
      } else {
        blurred
      }
    node.setRenderEffect(effect)
  }
}

// How far the blur draws in from outside, and how far a change counts, in deviations.
private const val REACH = 3f
private const val SEEN = 2f
private const val MIN_SIGMA_PX = 0.5f
private const val SIGMA_TO_RADIUS = 0.57735f
// The small picture's deviation at least this (its blur spans a dozen pixels or more); never
// smaller than an eighth (Telegram Android's frosted bars).
private const val SMALL_SIGMA_PX = 4f
private const val MIN_SCALE = 0.125f
