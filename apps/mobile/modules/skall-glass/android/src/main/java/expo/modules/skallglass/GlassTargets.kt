package expo.modules.skallglass

import java.lang.ref.WeakReference
import java.util.WeakHashMap

// The screens a glass can see through, by the id JavaScript gives them, and the glasses looking.
internal object GlassTargets {
  private val targets = HashMap<String, WeakReference<GlassTargetView>>()
  private val glasses = WeakHashMap<LiquidGlassView, Unit>()

  fun register(id: String, view: GlassTargetView) {
    targets[id] = WeakReference(view)
    changed()
  }

  fun unregister(id: String, view: GlassTargetView) {
    if (targets[id]?.get() === view) {
      targets.remove(id)
      changed()
    }
  }

  fun find(id: String?): GlassTargetView? = id?.let { targets[it]?.get() }

  fun watch(glass: LiquidGlassView) {
    glasses[glass] = Unit
  }

  fun unwatch(glass: LiquidGlassView) {
    glasses.remove(glass)
  }

  // A screen came or went: each glass looks again for its own.
  private fun changed() {
    glasses.keys.toList().forEach { it.invalidate() }
  }
}
