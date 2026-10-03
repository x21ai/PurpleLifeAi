import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

fun signingProp(vararg names: String): String? {
    for (name in names) {
        val fromFile = keystoreProperties.getProperty(name)?.trim()
        if (!fromFile.isNullOrEmpty()) return fromFile
        val fromEnv = System.getenv(name)?.trim()
        if (!fromEnv.isNullOrEmpty()) return fromEnv
    }
    return null
}

val uploadStoreFile = signingProp("PURPLE_UPLOAD_STORE_FILE", "storeFile")
val uploadStorePassword = signingProp("PURPLE_UPLOAD_STORE_PASSWORD", "storePassword")
val uploadKeyAlias = signingProp("PURPLE_UPLOAD_KEY_ALIAS", "keyAlias")
val uploadKeyPassword = signingProp("PURPLE_UPLOAD_KEY_PASSWORD", "keyPassword")
val hasUploadKeystore = listOf(
    uploadStoreFile,
    uploadStorePassword,
    uploadKeyAlias,
    uploadKeyPassword,
).all { !it.isNullOrEmpty() }

android {
    namespace = "org.purplelife.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "org.purplelife.app"
        minSdk = maxOf(flutter.minSdkVersion, 26)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasUploadKeystore) {
            create("release") {
                storeFile = file(uploadStoreFile!!)
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            // Play bundles must use the upload keystore. Local `flutter run --release`
            // can still use the debug key when the owner keystore is absent.
            // scripts/flutter-android-release.sh refuses that fallback.
            signingConfig = if (hasUploadKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
