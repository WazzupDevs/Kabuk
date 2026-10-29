package expo.modules.skallglass

import android.content.Context
import android.graphics.Canvas
import android.graphics.Rect
import android.graphics.RenderNode
import android.os.Build
import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.util.WeakHashMap

// A screen whose drawing a glass may show (Android 12 and later): its children are drawn into a
// RenderNode, which is then drawn here as usual and, by reference, under the glass. Nothing is
// copied: the GPU replays the same display list twice, the second time only where the glass is.
// Below Android 12 it draws as any view.
class GlassTargetView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  internal val content: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) RenderNode("skallGlassTarget") else null
  private var targetId: String? = null
  private val glasses = WeakHashMap<LiquidGlassView, Unit>()

  fun setTargetId(id: String?) {
    if (id == targetId) return
    targetId?.let { GlassTargets.unregister(it, this) }
    targetId = id
    if (id != null && isAttachedToWindow) GlassTargets.register(id, this)
  }

  internal fun addGlass(glass: LiquidGlassView) {
    glasses[glass] = Unit
  }

  internal fun removeGlass(glass: LiquidGlassView) {
    glasses.remove(glass)
  }

  // Something on the screen changed (a scroll, a move, new text): the glasses showing that part
  // draw again in the same frame. Only those whose sampled area the change reaches (the owner's
  // report, 29 Ekim: a buddy floating at the top made the tab bar's glass blur again on every
  // frame, the largest part of each frame on the Mekan screen). The changed view's place counts with
  // its transforms and without them (where it moves from and to), and a margin around it. A glass
  // is never inside its screen, so this cannot come back here.
  override fun onDescendantInvalidated(child: View, target: View) {
    super.onDescendantInvalidated(child, target)
    if (glasses.isEmpty()) return
    val reach = changedArea(target)
    glasses.keys.toList().forEach { if (reach == null || it.samples(reach)) it.invalidate() }
  }

  private val moved = Rect()
  private val laidOut = IntArray(2)

  // The window area a change of `view` may have touched; null when it cannot be told.
  private fun changedArea(view: View): Rect? {
    if (!view.isAttachedToWindow) return null
    val area = Rect()
    val shown = view.getGlobalVisibleRect(moved)
    view.getLocationInWindow(laidOut)
    area.set(laidOut[0], laidOut[1], laidOut[0] + view.width, laidOut[1] + view.height)
    if (shown) area.union(moved)
    val margin = (CHANGE_MARGIN_DP * resources.displayMetrics.density).toInt()
    area.inset(-margin, -margin)
    return area
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    targetId?.let { GlassTargets.register(it, this) }
  }

  override fun onDetachedFromWindow() {
    targetId?.let { GlassTargets.unregister(it, this) }
    content?.discardDisplayList()
    super.onDetachedFromWindow()
  }

  override fun dispatchDraw(canvas: Canvas) {
    val node = content
    if (node == null || !canvas.isHardwareAccelerated || width <= 0 || height <= 0) {
      super.dispatchDraw(canvas)
      return
    }
    node.setPosition(0, 0, width, height)
    val recording = node.beginRecording(width, height)
    try {
      super.dispatchDraw(recording)
    } finally {
      node.endRecording()
    }
    canvas.drawRenderNode(node)
    // The screen itself drew again (children came or went): so do the glasses.
    if (glasses.isNotEmpty()) glasses.keys.toList().forEach { it.invalidate() }
  }
}

// Around a changed view: a glow, a shadow or a small move past its box still reaches the glass.
private const val CHANGE_MARGIN_DP = 48f
