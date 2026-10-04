package com.callsend.gateway.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log
import com.callsend.gateway.services.CallGatewayService
import java.util.Date

class PhoneCallReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PhoneCallReceiver"
        private var lastState = TelephonyManager.CALL_STATE_IDLE
        private var callStartTime: Date? = null
        private var isIncoming = false
        private var savedNumber: String? = null
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            var state = TelephonyManager.CALL_STATE_IDLE
            if (stateStr == TelephonyManager.EXTRA_STATE_RINGING) {
                state = TelephonyManager.CALL_STATE_RINGING
            } else if (stateStr == TelephonyManager.EXTRA_STATE_OFFHOOK) {
                state = TelephonyManager.CALL_STATE_OFFHOOK
            }

            onCallStateChanged(context, state, number)
        }
    }

    private fun onCallStateChanged(context: Context, state: Int, number: String?) {
        if (lastState == state) {
            return
        }

        when (state) {
            TelephonyManager.CALL_STATE_RINGING -> {
                isIncoming = true
                callStartTime = Date()
                savedNumber = number
                Log.d(TAG, "Incoming call ringing from: $number")

                if (!number.isNullOrEmpty()) {
                    CallGatewayService.enqueueCallEvent(
                        context = context,
                        event = "CALL_START",
                        phoneNumber = number,
                        durationSeconds = 0
                    )
                }
            }

            TelephonyManager.CALL_STATE_OFFHOOK -> {
                if (lastState == TelephonyManager.CALL_STATE_RINGING) {
                    isIncoming = true
                    callStartTime = Date()
                    Log.d(TAG, "Call answered: $savedNumber")
                }
            }

            TelephonyManager.CALL_STATE_IDLE -> {
                if (lastState == TelephonyManager.CALL_STATE_RINGING) {
                    // Missed call
                    Log.d(TAG, "Missed call from: $savedNumber")
                    savedNumber?.let {
                        CallGatewayService.enqueueCallEvent(
                            context = context,
                            event = "CALL_MISSED",
                            phoneNumber = it,
                            durationSeconds = 0
                        )
                    }
                } else if (isIncoming) {
                    // Answered incoming call finished
                    val duration = if (callStartTime != null) {
                        ((Date().time - callStartTime!!.time) / 1000).toInt()
                    } else 0

                    Log.d(TAG, "Call ended with: $savedNumber, duration: ${duration}s")
                    savedNumber?.let {
                        CallGatewayService.enqueueCallEvent(
                            context = context,
                            event = "CALL_END",
                            phoneNumber = it,
                            durationSeconds = duration
                        )
                    }
                }

                callStartTime = null
                isIncoming = false
                savedNumber = null
            }
        }
        lastState = state
    }
}
