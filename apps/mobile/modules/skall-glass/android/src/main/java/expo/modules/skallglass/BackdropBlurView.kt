package expo.modules.skallglass

import android.annotation.TargetApi
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.ceil

// The screen behind a sheet, blurred (docs/design/aura → `.scrim`: backdrop-filter blur(8px), U8).
// A sheet is a window of its own (React Native's Modal) or a screen laid over the last one, so the
// glass cannot look through to it as it is drawn. As Telegram Android does behind its dialogs, the
// app's window is copied once, small, when the view arrives (before the sheet has drawn anything
// over it), and that still picture is drawn blurred behind the sheet for as long as it is open.
// The copy is the window as shown (PixelCopy), so maps and pictures on the GPU are in it too.
// Android 12 and later; below it the view draws nothing and the scrim's colour stays alone.
class BackdropBlurView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var sigma = 0f
  private var picture: Bitmap? = null
  private var scale = 1f
  private var asked = false
  private var recorded = false
  private val origin = IntArray(2)
  private val here = IntArray(2)
  private val node: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) RenderNode("skallBackdrop") else null

  init {
    setWillNotDraw(false)
  }

  // CSS's blur: the deviation in dp.
  fun setBlurDp(dp: Float) {
    val next = dp * resources.displayMetrics.density
    if (next == sigma) return
    sigma = next
    recorded = false
    invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    copyWindow()
  }

  override fun onDetachedFromWindow() {
    picture?.recycle()
    picture = null
    asked = false
    recorded = false
    super.onDetachedFromWindow()
  }

  private fun copyWindow() {
    if (asked || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    val window = appContext.currentActivity?.window ?: return
    val decor = window.decorView
    if (decor.width <= 0 || decor.height <= 0) return
    asked = true
    // Small enough that the small picture's blur still spans a few pixels, never under an eighth
    // (LiquidGlassView's rule, Telegram's frosted bars).
    val s = if (sigma > 0f) (SMALL_SIGMA_PX / sigma).coerceIn(MIN_SCALE, 1f) else MIN_SCALE
    val w = ceil(decor.width * s).toInt().coerceAtLeast(1)
    val h = ceil(decor.height * s).toInt().coerceAtLeast(1)
    val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    decor.getLocationOnScreen(origin)
    try {
      PixelCopy.request(
        window,
        bitmap,
        { result ->
          if (result == PixelCopy.SUCCESS && isAttachedToWindow) {
            picture?.recycle()
            picture = bitmap
            scale = w.toFloat() / decor.width
            recorded = false
            invalidate()
          } else {
            bitmap.recycle()
          }
        },
        Handler(Looper.getMainLooper()),
      )
    } catch (e: IllegalArgumentException) {
      // The window has no surface yet: no blur, the scrim's colour alone.
      bitmap.recycle()
    }
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val pic = picture ?: return
    val node = node ?: return
    if (!canvas.isHardwareAccelerated || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    if (!recorded) record(node, pic)
    getLocationOnScreen(here)
    val saved = canvas.save()
    canvas.translate((origin[0] - here[0]).toFloat(), (origin[1] - here[1]).toFloat())
    canvas.scale(1f / scale, 1f / scale)
    canvas.drawRenderNode(node)
    canvas.restoreToCount(saved)
  }

  @TargetApi(Build.VERSION_CODES.S)
  private fun record(node: RenderNode, pic: Bitmap) {
    recorded = true
    val smallSigma = sigma * scale
    // React Native's and Telegram's conversion: deviation 0.57735 × radius + 0.5.
    val radius = if (smallSigma > MIN_SIGMA_PX) (smallSigma - MIN_SIGMA_PX) / SIGMA_TO_RADIUS else 0f
    node.setPosition(0, 0, pic.width, pic.height)
    node.setRenderEffect(
      if (radius > 0f) RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP) else null
    )
    val recording = node.beginRecording(pic.width, pic.height)
    try {
      recording.drawBitmap(pic, 0f, 0f, null)
    } finally {
      node.endRecording()
    }
  }
}

private const val MIN_SIGMA_PX = 0.5f
private const val SIGMA_TO_RADIUS = 0.57735f
private const val SMALL_SIGMA_PX = 4f
private const val MIN_SCALE = 0.125f
