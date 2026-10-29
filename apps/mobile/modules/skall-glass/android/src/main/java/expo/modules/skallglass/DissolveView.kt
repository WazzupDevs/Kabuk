package expo.modules.skallglass

import android.animation.Animator
import android.annotation.TargetApi
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.view.animation.PathInterpolator
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import kotlin.math.ceil

// A tab screen's blur dissolve (the film's tab switch: blur 12 to none over the arrival, on its
// curve), drawn here instead of by React Native (the owner's report, 29 Ekim). React Native's
// `filter: blur` drew the whole screen at full size into a layer and blurred it on every frame, so
// the app stepped it down in three; here it runs on its own every frame, and the screen is drawn
// small into the layer before it is blurred (a quarter of the size at the strongest blur): what is
// blurred loses nothing by being small. The blur is the same as React Native's (sigma in dp, its
// radius conversion, the edges fading). Each new `run` starts it; Android 12 and later only, below
// it the screen draws as any view.
class DissolveView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val density = resources.displayMetrics.density
  private val node: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) RenderNode("skallDissolve") else null
  private var run = 0
  private var blurDp = 0f
  private var durationMs = 0L
  private var curve = floatArrayOf(0f, 0f, 1f, 1f)
  // 0 at the strongest blur, 1 sharp.
  private var progress = 1f
  private var animator: ValueAnimator? = null

  fun setRun(value: Int) {
    if (value == run) return
    run = value
    if (value == 0) return
    // After every prop of this update is set (the blur and the time may come after the run).
    post { start() }
  }

  fun setBlurDp(value: Float) {
    blurDp = value
  }

  fun setDurationMs(value: Int) {
    durationMs = value.toLong()
  }

  fun setCurve(list: List<Double>) {
    if (list.size == 4) curve = FloatArray(4) { list[it].toFloat() }
  }

  private fun start() {
    animator?.cancel()
    if (node == null || blurDp <= 0f || durationMs <= 0L) return
    progress = 0f
    invalidate()
    animator =
      ValueAnimator.ofFloat(0f, 1f).apply {
        setDuration(durationMs)
        setInterpolator(PathInterpolator(curve[0], curve[1], curve[2], curve[3]))
        addUpdateListener {
          progress = it.animatedValue as Float
          invalidate()
        }
        addListener(
          object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: Animator) {
              progress = 1f
              node?.discardDisplayList()
              invalidate()
            }
          },
        )
        start()
      }
  }

  override fun onDetachedFromWindow() {
    animator?.cancel()
    animator = null
    progress = 1f
    node?.discardDisplayList()
    super.onDetachedFromWindow()
  }

  override fun dispatchDraw(canvas: Canvas) {
    val n = node
    val sigma = blurDp * density * (1f - progress)
    if (
      n == null ||
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
        progress >= 1f ||
        sigma <= MIN_SIGMA_PX ||
        !canvas.isHardwareAccelerated ||
        width <= 0 ||
        height <= 0
    ) {
      super.dispatchDraw(canvas)
      return
    }
    drawBlurred(canvas, n, sigma)
  }

  @TargetApi(Build.VERSION_CODES.S)
  private fun drawBlurred(canvas: Canvas, n: RenderNode, sigma: Float) {
    // React Native's conversion (FilterHelper.sigmaToRadius).
    val radius = (sigma - MIN_SIGMA_PX) / SIGMA_TO_RADIUS
    // Small enough that the small picture still blurs over a few pixels, never smaller than a
    // quarter: the upscaled blur is as smooth as the full one.
    val scale = (SMALL_RADIUS_PX / radius).coerceIn(MIN_SCALE, 1f)
    val w = ceil(width * scale).toInt()
    val h = ceil(height * scale).toInt()
    n.setPosition(0, 0, w, h)
    n.setRenderEffect(
      RenderEffect.createBlurEffect(radius * scale, radius * scale, Shader.TileMode.DECAL),
    )
    val recording = n.beginRecording(w, h)
    try {
      recording.scale(scale, scale)
      super.dispatchDraw(recording)
    } finally {
      n.endRecording()
    }
    val saved = canvas.save()
    canvas.scale(1f / scale, 1f / scale)
    canvas.drawRenderNode(n)
    canvas.restoreToCount(saved)
  }
}

private const val MIN_SIGMA_PX = 0.5f
private const val SIGMA_TO_RADIUS = 0.57735f
private const val SMALL_RADIUS_PX = 6f
private const val MIN_SCALE = 0.25f
