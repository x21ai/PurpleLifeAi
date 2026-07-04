import UIKit
import Capacitor
import LuciqSDK
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var luciqStarted = false
    private var launchProbeStarted = false
    private var fallbackShellShown = false

    private let previousLaunchMarkerKey = "purple.launch.marker"
    private let lastLaunchIssueKey = "purple.launch.last_issue"
    private let bridgeEventSource = "purple-native"
    private let launchURL = URL(string: "https://www.purplelife.org")!

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        markLaunchInProgress()
        publishDiagFlag()
        publishLastLaunchIssueIfAny()
        probeLaunchURL()
        startLuciqWhenAppIsStable()
        return true
    }

    private func startLuciqWhenAppIsStable() {
        guard !luciqStarted else { return }
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "LUCIQAppToken") as? String else {
            recordLaunchIssue(
                code: "luciq_token_missing",
                message: "LUCIQ token is missing in Info.plist.",
                url: launchURL.absoluteString
            )
            return
        }
        let token = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !token.isEmpty, token != "$(LUCIQ_APP_TOKEN)" else {
            recordLaunchIssue(
                code: "luciq_token_empty",
                message: "LUCIQ token is empty or unresolved.",
                url: launchURL.absoluteString
            )
            return
        }

        // Defer SDK bootstrap until the app has settled so launch is never blocked.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
            guard let self = self, !self.luciqStarted else { return }
            CrashReporting.enableSendingLaunchCrashesSynchronously()
            Luciq.start(
                withToken: token,
                invocationEvents: [.shake]
            )
            self.luciqStarted = true
        }
    }

    private func markLaunchInProgress() {
        let defaults = UserDefaults.standard
        if defaults.bool(forKey: previousLaunchMarkerKey) {
            recordLaunchIssue(
                code: "previous_launch_incomplete",
                message: "Previous app launch did not fully complete.",
                url: launchURL.absoluteString
            )
        }
        defaults.set(true, forKey: previousLaunchMarkerKey)
    }

    private func clearLaunchMarker() {
        UserDefaults.standard.set(false, forKey: previousLaunchMarkerKey)
    }

    private func probeLaunchURL() {
        guard !launchProbeStarted else { return }
        launchProbeStarted = true
        var request = URLRequest(url: launchURL)
        request.httpMethod = "HEAD"
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 6

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            guard let self = self else { return }
            if let error = error {
                self.handleLaunchProbeFailure(message: error.localizedDescription)
                return
            }
            if let status = (response as? HTTPURLResponse)?.statusCode,
               !(200...399).contains(status), status != 405 {
                self.handleLaunchProbeFailure(message: "HTTP \(status)")
            }
        }.resume()
    }

    private func handleLaunchProbeFailure(message: String) {
        recordLaunchIssue(
            code: "remote_launch_unreachable",
            message: "Remote shell launch URL failed to load.",
            url: launchURL.absoluteString,
            error: message
        )
        loadFallbackShell(error: message)
    }

    private func loadFallbackShell(error: String, attempt: Int = 0) {
        guard !fallbackShellShown else { return }
        guard attempt < 8 else { return }

        DispatchQueue.main.asyncAfter(deadline: .now() + (attempt == 0 ? 0.0 : 0.35)) { [weak self] in
            guard let self = self else { return }
            guard let webView = self.currentWebView() else {
                self.loadFallbackShell(error: error, attempt: attempt + 1)
                return
            }
            self.fallbackShellShown = true

            var components = URLComponents()
            components.scheme = "capacitor"
            components.host = "localhost"
            components.path = "/index.html"
            components.queryItems = [
                URLQueryItem(name: "targetUrl", value: self.launchURL.absoluteString),
                URLQueryItem(name: "launchError", value: error),
                URLQueryItem(name: "build", value: self.buildLabel),
                URLQueryItem(name: "diag", value: self.defaultDiagEnabled ? "1" : "0"),
            ]

            guard let fallbackURL = components.url else { return }
            webView.load(URLRequest(url: fallbackURL))
        }
    }

    private var defaultDiagEnabled: Bool {
        #if DEBUG
        return true
        #else
        guard let receiptURL = Bundle.main.appStoreReceiptURL else { return false }
        return receiptURL.lastPathComponent == "sandboxReceipt"
        #endif
    }

    private var buildLabel: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?"
        return "\(version) (\(build))"
    }

    private func publishDiagFlag() {
        emitBridgeEvent(
            type: "diag-flag",
            payload: [
                "enabled": defaultDiagEnabled,
                "build": buildLabel,
            ]
        )
    }

    private func publishLastLaunchIssueIfAny() {
        guard let last = UserDefaults.standard.dictionary(forKey: lastLaunchIssueKey) else { return }
        emitBridgeEvent(type: "launch-error", payload: last)
    }

    private func recordLaunchIssue(code: String, message: String, url: String? = nil, error: String? = nil) {
        var payload: [String: Any] = [
            "code": code,
            "message": message,
            "at": ISO8601DateFormatter().string(from: Date()),
            "build": buildLabel,
        ]
        if let url = url {
            payload["url"] = url
        }
        if let error = error, !error.isEmpty {
            payload["error"] = error
        }
        UserDefaults.standard.set(payload, forKey: lastLaunchIssueKey)
        print("[native] \(code): \(message)\(error.map { " (\($0))" } ?? "")")
        emitBridgeEvent(type: "launch-error", payload: payload)
    }

    private func emitBridgeEvent(type: String, payload: [String: Any], attempt: Int = 0) {
        guard attempt < 8 else { return }
        guard JSONSerialization.isValidJSONObject(payload),
              let payloadData = try? JSONSerialization.data(withJSONObject: payload),
              let payloadJSON = String(data: payloadData, encoding: .utf8) else {
            return
        }

        let escapedType = type.replacingOccurrences(of: "\"", with: "\\\"")
        let script = """
        (() => {
          const message = { source: "\(bridgeEventSource)", type: "\(escapedType)", payload: \(payloadJSON) };
          try {
            window.dispatchEvent(new CustomEvent("purple:native-event", { detail: message }));
            window.dispatchEvent(new CustomEvent("purple:native-" + message.type, { detail: message.payload || {} }));
            window.postMessage(message, "*");
            if (message.type === "diag-flag" && typeof message.payload?.enabled === "boolean") {
              window.__PURPLE_NATIVE_DIAG_ENABLED__ = message.payload.enabled;
            }
          } catch (_) {}
        })();
        """

        DispatchQueue.main.asyncAfter(deadline: .now() + (attempt == 0 ? 0.1 : 0.35)) { [weak self] in
            guard let self = self else { return }
            guard let webView = self.currentWebView() else {
                self.emitBridgeEvent(type: type, payload: payload, attempt: attempt + 1)
                return
            }
            webView.evaluateJavaScript(script) { _, error in
                if error != nil {
                    self.emitBridgeEvent(type: type, payload: payload, attempt: attempt + 1)
                }
            }
        }
    }

    private func currentWebView() -> WKWebView? {
        if let bridgeVC = window?.rootViewController as? CAPBridgeViewController {
            return bridgeVC.bridge?.webView
        }
        if let nav = window?.rootViewController as? UINavigationController,
           let bridgeVC = nav.viewControllers.first as? CAPBridgeViewController {
            return bridgeVC.bridge?.webView
        }
        return nil
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        clearLaunchMarker()
        publishDiagFlag()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
        clearLaunchMarker()
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
