package expo.modules.skallglass

import android.graphics.Color
import android.os.Build
import android.view.WindowInsetsController
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// skall's glass: a tab screen records what it draws (GlassTargetView), the tab bar and the message
// bar draw that record under themselves, frosted (LiquidGlassView; frosted since 29 Ekim, the
// owner's call), a tab screen's arrival blurs and clears (DissolveView), and soft shadows are drawn
// from pictures made once (ShadowView).
class SkallGlassModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SkallGlass")

    // The navigation buttons dark on a light screen, light on a dark one: Android no longer shades
    // their strip (app.config.ts → withClearNavigationBar), so their colour follows the app's theme.
    AsyncFunction("setLightNavigationBar") { light: Boolean ->
      val window = appContext.currentActivity?.window ?: return@AsyncFunction
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val flag = WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
        window.insetsController?.setSystemBarsAppearance(if (light) flag else 0, flag)
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        @Suppress("DEPRECATION")
        val flags = window.decorView.systemUiVisibility
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
          if (light) flags or android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
          else flags and android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
      }
    }.runOnQueue(Queues.MAIN)

    View(GlassTargetView::class) {
      Name("GlassTargetView")
      Prop("targetId") { view: GlassTargetView, id: String? -> view.setTargetId(id) }
      Prop("backdrop") { view: GlassTargetView, value: Boolean -> view.backdrop = value }
    }

    View(DissolveView::class) {
      Name("DissolveView")
      Prop("run") { view: DissolveView, value: Int -> view.setRun(value) }
      Prop("blur") { view: DissolveView, dp: Float -> view.setBlurDp(dp) }
      Prop("durationMs") { view: DissolveView, ms: Int -> view.setDurationMs(ms) }
      Prop("curve") { view: DissolveView, list: List<Double> -> view.setCurve(list) }
    }

    View(ShadowView::class) {
      Name("ShadowView")
      Prop("shadows") { view: ShadowView, list: List<Map<String, Any?>> -> view.setShadows(list) }
      Prop("radii") { view: ShadowView, list: List<Double> -> view.setRadii(list) }
    }

    View(LiquidGlassView::class) {
      Name("LiquidGlassView")
      Prop("targetId") { view: LiquidGlassView, id: String? -> view.targetId = id }
      Prop("backdrop") { view: LiquidGlassView, value: Boolean -> view.backdrop = value }
      Prop("cornerRadius") { view: LiquidGlassView, radius: Float -> view.setCornerRadiusDp(radius) }
      Prop("ground") { view: LiquidGlassView, color: Color? -> view.ground = color?.toArgb() }
      Prop("blur") { view: LiquidGlassView, dp: Float -> view.setBlurDp(dp) }
      Prop("saturation") { view: LiquidGlassView, value: Float -> view.setSaturation(value) }
    }
  }
}
