package expo.modules.skallglass

import android.graphics.Color
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// skall's liquid glass (the owner's call, 27 Ekim): a tab screen records what it draws
// (GlassTargetView), the tab bar draws that record under itself through a lens (LiquidGlassView).
class SkallGlassModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SkallGlass")

    View(GlassTargetView::class) {
      Name("GlassTargetView")
      Prop("targetId") { view: GlassTargetView, id: String? -> view.setTargetId(id) }
    }

    View(LiquidGlassView::class) {
      Name("LiquidGlassView")
      Prop("targetId") { view: LiquidGlassView, id: String? -> view.targetId = id }
      Prop("cornerRadius") { view: LiquidGlassView, radius: Float -> view.setCornerRadiusDp(radius) }
      Prop("ground") { view: LiquidGlassView, color: Color? -> view.ground = color?.toArgb() }
      Prop("blurRadius") { view: LiquidGlassView, radius: Float -> view.setBlurDp(radius) }
      Prop("refraction") { view: LiquidGlassView, px: Float -> view.setRefractionDp(px) }
      Prop("depth") { view: LiquidGlassView, px: Float -> view.setDepthDp(px) }
      Prop("dispersion") { view: LiquidGlassView, value: Float -> view.setDispersion(value) }
      Prop("highlight") { view: LiquidGlassView, value: Float -> view.setHighlight(value) }
    }
  }
}
