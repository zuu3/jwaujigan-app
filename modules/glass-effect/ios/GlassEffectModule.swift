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

// MARK: - GlassButton

class GlassButtonView: ExpoView {
  let onPress = EventDispatcher()
  private var button: UIButton!

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    let action = UIAction { [weak self] _ in self?.onPress([:]) }
    if #available(iOS 26.0, *) {
      var cfg = UIButton.Configuration.glass()
      cfg.cornerStyle = .capsule
      button = UIButton(configuration: cfg, primaryAction: action)
    } else {
      var cfg = UIButton.Configuration.tinted()
      cfg.cornerStyle = .capsule
      cfg.baseBackgroundColor = UIColor.systemBackground.withAlphaComponent(0.7)
      cfg.baseForegroundColor = UIColor.label
      button = UIButton(configuration: cfg, primaryAction: action)
    }
    button.translatesAutoresizingMaskIntoConstraints = false
    addSubview(button)
    NSLayoutConstraint.activate([
      button.topAnchor.constraint(equalTo: topAnchor),
      button.bottomAnchor.constraint(equalTo: bottomAnchor),
      button.leadingAnchor.constraint(equalTo: leadingAnchor),
      button.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
  }

  func setLabel(_ text: String) {
    button.configuration?.title = text.isEmpty ? nil : text
  }

  func setSystemImage(_ name: String) {
    button.configuration?.image = name.isEmpty ? nil : UIImage(systemName: name)
  }

  func setTintHex(_ hex: String) {
    guard !hex.isEmpty, let color = UIColor(hexString: hex) else {
      button.tintColor = nil
      return
    }
    button.tintColor = color
  }
}

extension UIColor {
  convenience init?(hexString: String) {
    let h = hexString.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    guard h.count == 6, let v = UInt64(h, radix: 16) else { return nil }
    self.init(
      red: CGFloat((v >> 16) & 0xFF) / 255,
      green: CGFloat((v >> 8) & 0xFF) / 255,
      blue: CGFloat(v & 0xFF) / 255,
      alpha: 1.0
    )
  }
}

public class GlassButtonModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GlassButton")

    View(GlassButtonView.self) {
      Events("onPress")
      Prop("label") { (view: GlassButtonView, text: String) in view.setLabel(text) }
      Prop("systemImage") { (view: GlassButtonView, name: String) in view.setSystemImage(name) }
      Prop("tintHex") { (view: GlassButtonView, hex: String) in view.setTintHex(hex) }
    }
  }
}
