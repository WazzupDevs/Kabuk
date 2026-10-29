package expo.modules.skallglass

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.util.LruCache
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.max

// A box's soft outer shadows drawn from a picture made once (the owner's call, 29 Ekim: the app
// stuttered; React Native's boxShadow blurs every shadow again on every frame). The picture is the
// same Gaussian shadow React Native draws (sigma half the blur, its radius conversion), with the box
// itself cut out, made in software once per shadow and corner set and kept; a frame draws it in
// nine pieces around the view, its edges stretched, which the GPU does as plain texture copies.
// The view is laid over its box (absolute fill) and draws outside its bounds, as boxShadow does.
class ShadowView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  data class Spec(val x: Float, val y: Float, val blur: Float, val spread: Float, val color: Int)

  private val density = resources.displayMetrics.density
  private var specs: List<Spec> = emptyList()
  private var radii = FloatArray(4)
  private val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
  private val src = Rect()
  private val dst = RectF()

  init {
    setWillNotDraw(false)
    clipChildren = false
    clipToPadding = false
  }

  fun setShadows(list: List<Map<String, Any?>>) {
    specs = list.map {
      Spec(
        x = (it["x"] as? Number)?.toFloat() ?: 0f,
        y = (it["y"] as? Number)?.toFloat() ?: 0f,
        blur = (it["blur"] as? Number)?.toFloat() ?: 0f,
        spread = (it["spread"] as? Number)?.toFloat() ?: 0f,
        color = (it["color"] as? Number)?.toLong()?.toInt() ?: 0,
      )
    }
    invalidate()
  }

  // Top left, top right, bottom right, bottom left (dp).
  fun setRadii(list: List<Double>) {
    radii = FloatArray(4) { i -> list.getOrNull(i)?.toFloat() ?: 0f }
    invalidate()
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val w = width
    val h = height
    if (w <= 0 || h <= 0) return
    // The first shadow is on top, as in CSS.
    for (spec in specs.asReversed()) {
      val piece = ShadowPictures.get(spec, radii, density, w, h) ?: continue
      draw(canvas, piece, w, h)
    }
  }

  private fun draw(canvas: Canvas, p: ShadowPicture, w: Int, h: Int) {
    val b = p.bitmap
    // Columns and rows in the picture and on the screen: the outer parts keep their size, the
    // middle stretches. A side too short to stretch was drawn at its own length (one piece).
    val sx = if (p.sliceX) intArrayOf(0, p.left, b.width - p.right, b.width) else intArrayOf(0, b.width)
    val sy = if (p.sliceY) intArrayOf(0, p.top, b.height - p.bottom, b.height) else intArrayOf(0, b.height)
    val pad = p.pad.toFloat()
    val dx =
      if (p.sliceX) floatArrayOf(-pad, p.left - pad, w - (p.right - pad), w + pad)
      else floatArrayOf(-pad, w + pad)
    val dy =
      if (p.sliceY) floatArrayOf(-pad, p.top - pad, h - (p.bottom - pad), h + pad)
      else floatArrayOf(-pad, h + pad)
    for (row in 0 until sy.size - 1) {
      for (col in 0 until sx.size - 1) {
        // The middle lies inside the box, where the picture is cut out.
        if (p.sliceX && p.sliceY && row == 1 && col == 1) continue
        if (dx[col + 1] <= dx[col] || dy[row + 1] <= dy[row]) continue
        src.set(sx[col], sy[row], sx[col + 1], sy[row + 1])
        dst.set(dx[col], dy[row], dx[col + 1], dy[row + 1])
        canvas.drawBitmap(b, src, dst, paint)
      }
    }
  }
}

// A shadow's picture: the shadow around a box (cut out), `pad` px beyond the box on every side;
// `left`, `top`, `right`, `bottom`: how far from the picture's edges its middle (where every column
// or row is the same) begins. `sliceX`, `sliceY`: whether it stretches that way; a box too narrow
// (or too low) for its corners and blur gets a picture made at its own width (or height).
class ShadowPicture(
  val bitmap: Bitmap,
  val pad: Int,
  val left: Int,
  val top: Int,
  val right: Int,
  val bottom: Int,
  val sliceX: Boolean,
  val sliceY: Boolean,
)

internal object ShadowPictures {
  private val cache = object : LruCache<String, ShadowPicture>(48 * 1024 * 1024) {
    override fun sizeOf(key: String, value: ShadowPicture) = value.bitmap.byteCount
  }

  fun get(
    spec: ShadowView.Spec,
    radiiDp: FloatArray,
    density: Float,
    w: Int,
    h: Int,
  ): ShadowPicture? {
    if (spec.color ushr 24 == 0) return null
    // A corner rounds at most half the box (CSS).
    val half = minOf(w, h) / 2f
    val r = FloatArray(4) { minOf(radiiDp[it] * density, half) }
    val ox = spec.x * density
    val oy = spec.y * density
    val spread = spec.spread * density
    val blur = spec.blur * density
    // React Native's shadow: sigma half the blur, as a BlurMaskFilter radius (FilterHelper).
    val sigma = 0.5f * blur
    val maskRadius = if (sigma > 0.5f) (sigma - 0.5f) / 0.57735f else 0f
    val reach = ceil(3f * sigma).toInt() + 1
    val pad = reach + ceil(abs(spread)).toInt() + ceil(max(abs(ox), abs(oy))).toInt()
    // Where the shadow along an edge stops changing: past the corners' round and the blur.
    val left = pad + ceil(max(r[0], r[3]) + reach + abs(ox) + max(spread, 0f)).toInt() + 1
    val right = pad + ceil(max(r[1], r[2]) + reach + abs(ox) + max(spread, 0f)).toInt() + 1
    val top = pad + ceil(max(r[0], r[1]) + reach + abs(oy) + max(spread, 0f)).toInt() + 1
    val bottom = pad + ceil(max(r[2], r[3]) + reach + abs(oy) + max(spread, 0f)).toInt() + 1
    val sliceX = w >= left + right - 2 * pad + 2
    val sliceY = h >= top + bottom - 2 * pad + 2
    val boxW = if (sliceX) left + right - 2 * pad + 2 else w
    val boxH = if (sliceY) top + bottom - 2 * pad + 2 else h
    val key = buildString {
      append(spec.color).append('|').append(ox).append('|').append(oy).append('|')
      append(blur).append('|').append(spread).append('|')
      r.forEach { append(it).append(',') }
      append('|').append(if (sliceX) -1 else w).append('x').append(if (sliceY) -1 else h)
    }
    cache.get(key)?.let { return it }
    val bw = boxW + 2 * pad
    val bh = boxH + 2 * pad
    if (bw <= 0 || bh <= 0 || bw > 4096 || bh > 4096) return null
    val bitmap = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val shadow = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = spec.color
      if (maskRadius > 0f) maskFilter = BlurMaskFilter(maskRadius, BlurMaskFilter.Blur.NORMAL)
    }
    val shape = RectF(
      pad + ox - spread,
      pad + oy - spread,
      pad + ox + boxW + spread,
      pad + oy + boxH + spread,
    )
    canvas.drawPath(roundRect(shape, FloatArray(4) { grow(r[it], spread) }), shadow)
    // The box itself is cut out: a translucent box shows no shadow under it (boxShadow clips it
    // out the same way).
    val clear = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
    }
    canvas.drawPath(
      roundRect(RectF(pad.toFloat(), pad.toFloat(), (pad + boxW).toFloat(), (pad + boxH).toFloat()), r),
      clear,
    )
    val picture = ShadowPicture(bitmap, pad, left, top, right, bottom, sliceX, sliceY)
    bitmap.prepareToDraw()
    cache.put(key, picture)
    return picture
  }

  // CSS: a spread grows a round corner by the spread; a square one stays square.
  private fun grow(radius: Float, spread: Float): Float =
    if (radius <= 0f) 0f else max(0f, radius + spread)

  private fun roundRect(rect: RectF, r: FloatArray): Path {
    val path = Path()
    val half = minOf(rect.width(), rect.height()) / 2f
    val c = FloatArray(4) { minOf(r[it], half) }
    path.addRoundRect(
      rect,
      floatArrayOf(c[0], c[0], c[1], c[1], c[2], c[2], c[3], c[3]),
      Path.Direction.CW,
    )
    return path
  }
}
