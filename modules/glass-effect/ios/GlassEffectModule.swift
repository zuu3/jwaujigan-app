import ExpoModulesCore
import UIKit

// GlassEffectView: iOS 26+ UIGlassEffect, fallback UIBlurEffect on older iOS
class GlassEffectView: ExpoView {
  private var effectView: UIVisualEffectView?
  private var cornerRadiusValue: CGFloat = 999

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    applyEffect()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    effectView?.frame = bounds
    updateCornerRadius()
  }

  func setCornerRadius(_ radius: CGFloat) {
    cornerRadiusValue = radius
    updateCornerRadius()
  }

  private func updateCornerRadius() {
    layer.cornerRadius = cornerRadiusValue
    effectView?.layer.cornerRadius = cornerRadiusValue
    effectView?.clipsToBounds = true
  }

  private func applyEffect() {
    effectView?.removeFromSuperview()

    let effect: UIVisualEffect
    if #available(iOS 26.0, *) {
      effect = UIGlassEffect()
    } else {
      effect = UIBlurEffect(style: .systemUltraThinMaterial)
    }

    let ev = UIVisualEffectView(effect: effect)
    ev.frame = bounds
    ev.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    ev.layer.cornerRadius = cornerRadiusValue
    ev.clipsToBounds = true
    insertSubview(ev, at: 0)
    effectView = ev
  }
}

public class GlassEffectModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GlassEffect")

    View(GlassEffectView.self) {
      Prop("cornerRadius") { (view: GlassEffectView, radius: CGFloat) in
        view.setCornerRadius(radius)
      }
    }
  }
}
