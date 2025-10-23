import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleMaps

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "golisoda_delivery"
    self.dependencyProvider = RCTAppDependencyProvider()

    // Provide Google Maps API Key
    GMSServices.provideAPIKey("AIzaSyAjhAUSBUszFtkWC_gLPGhVz15A_HeQO5Q")

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    // Preserve RN linking handling
    let handledBySuper = super.application(app, open: url, options: options)

    // Post your custom notification
    let userInfo: [String: Any] = [
      "options": options,
      "openUrl": url
    ]
    NotificationCenter.default.post(
      name: Notification.Name("ApplicationOpenURLNotification"),
      object: nil,
      userInfo: userInfo
    )

    return handledBySuper
  }
}
