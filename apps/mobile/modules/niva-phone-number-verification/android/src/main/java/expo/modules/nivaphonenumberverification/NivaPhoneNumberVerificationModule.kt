package expo.modules.nivaphonenumberverification

import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.firebase.pnv.FirebasePhoneNumberVerification

class NivaPhoneNumberVerificationModule : Module() {
  private val phoneNumberVerification by lazy {
    FirebasePhoneNumberVerification.getInstance()
  }

  override fun definition() = ModuleDefinition {
    Name("NivaPhoneNumberVerification")

    AsyncFunction("enableTestSessionAsync") { testToken: String, promise: Promise ->
      try {
        phoneNumberVerification.enableTestSession(testToken)
        promise.resolve()
      } catch (exception: Exception) {
        promise.reject(
          "ERR_NIVA_PNV_TEST_SESSION",
          "Unable to enable the Firebase PNV test session.",
          exception,
        )
      }
    }

    AsyncFunction("getSupportInfoAsync") { promise: Promise ->
      phoneNumberVerification.getVerificationSupportInfo()
        .addOnSuccessListener { results ->
          promise.resolve(mapOf("supported" to results.any { it.isSupported() }))
        }
        .addOnFailureListener { exception ->
          promise.reject(
            "ERR_NIVA_PNV_SUPPORT",
            "Unable to check Firebase PNV support on this device.",
            exception,
          )
        }
    }

    AsyncFunction("requestVerificationAsync") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject(
          "ERR_NIVA_PNV_ACTIVITY",
          "Firebase PNV requires an active Android screen.",
          null,
        )
        return@AsyncFunction
      }

      phoneNumberVerification.getVerifiedPhoneNumber(activity)
        .addOnSuccessListener { result ->
          // Keep the phone number out of the JavaScript runtime. The backend
          // verifies the signed PNV token and obtains the number from its subject.
          promise.resolve(mapOf("pnvToken" to result.getToken()))
        }
        .addOnFailureListener { exception ->
          promise.reject(
            "ERR_NIVA_PNV_VERIFICATION",
            "Phone number verification was not completed.",
            exception,
          )
        }
    }.runOnQueue(Queues.MAIN)
  }
}
