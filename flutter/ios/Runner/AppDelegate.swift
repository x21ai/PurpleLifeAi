import Flutter
import LuciqSDK
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private var luciqStarted = false

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    startLuciqWhenAppIsStable()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func startLuciqWhenAppIsStable() {
    guard !luciqStarted else { return }
    guard let raw = Bundle.main.object(forInfoDictionaryKey: "LUCIQAppToken") as? String else {
      return
    }
    let token = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !token.isEmpty, token != "$(LUCIQ_APP_TOKEN)" else {
      return
    }

    // Defer SDK bootstrap; never block Flutter engine launch.
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
      guard let self = self, !self.luciqStarted else { return }
      self.luciqStarted = true
      Luciq.start(
        withToken: token,
        invocationEvents: [.shake]
      )
    }
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
