package com.callsend.gateway.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.callsend.gateway.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class CallGatewayService : Service() {

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    companion object {
        private const val TAG = "CallGatewayService"
        private const val CHANNEL_ID = "CallSendGatewayChannel"
        private const val NOTIFICATION_ID = 1001

        const val ACTION_ENQUEUE_EVENT = "com.callsend.gateway.ACTION_ENQUEUE_EVENT"
        const val EXTRA_EVENT_TYPE = "extra_event_type"
        const val EXTRA_PHONE_NUMBER = "extra_phone_number"
        const val EXTRA_DURATION = "extra_duration"

        fun enqueueCallEvent(context: Context, event: String, phoneNumber: String, durationSeconds: Int) {
            val intent = Intent(context, CallGatewayService::class.java).apply {
                action = ACTION_ENQUEUE_EVENT
                putExtra(EXTRA_EVENT_TYPE, event)
                putExtra(EXTRA_PHONE_NUMBER, phoneNumber)
                putExtra(EXTRA_DURATION, durationSeconds)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification())
        startHeartbeatLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_ENQUEUE_EVENT) {
            val eventType = intent.getStringExtra(EXTRA_EVENT_TYPE) ?: "UNKNOWN"
            val phoneNumber = intent.getStringExtra(EXTRA_PHONE_NUMBER) ?: ""
            val duration = intent.getIntExtra(EXTRA_DURATION, 0)

            serviceScope.launch {
                sendEventToServer(eventType, phoneNumber, duration)
            }
        }
        return START_STICKY
    }

    private suspend fun sendEventToServer(eventType: String, phoneNumber: String, duration: Int) {
        val prefs = getSharedPreferences("callsend_config", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", "http://10.0.2.2:4000") ?: "http://10.0.2.2:4000"
        val deviceToken = prefs.getString("device_token", "test_android_token_777") ?: "test_android_token_777"

        val endpoint = "$serverUrl/api/v1/telephony/events"

        val payload = JSONObject().apply {
            put("event", eventType)
            put("caller_number", phoneNumber)
            put("device_token", deviceToken)
            put("duration", duration)
            put("timestamp", java.time.Instant.now().toString())
        }

        try {
            val body = payload.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(endpoint)
                .post(body)
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                Log.d(TAG, "Event $eventType successfully sent to $endpoint")
            } else {
                Log.e(TAG, "Server responded with error: ${response.code}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send call event: ${e.message}")
        }
    }

    private fun startHeartbeatLoop() {
        serviceScope.launch {
            while (isActive) {
                delay(60_000) // Every 1 minute
                sendHeartbeat()
            }
        }
    }

    private fun sendHeartbeat() {
        val prefs = getSharedPreferences("callsend_config", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", "http://10.0.2.2:4000") ?: "http://10.0.2.2:4000"
        val deviceToken = prefs.getString("device_token", "test_android_token_777") ?: "test_android_token_777"

        val bm = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val batteryPct = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

        val payload = JSONObject().apply {
            put("deviceToken", deviceToken)
            put("batteryLevel", batteryPct)
        }

        try {
            val body = payload.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$serverUrl/api/v1/telephony/devices/heartbeat")
                .post(body)
                .build()
            httpClient.newCall(request).execute()
        } catch (e: Exception) {
            Log.w(TAG, "Heartbeat failed: ${e.message}")
        }
    }

    private fun buildForegroundNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CallSend Gateway Faol")
            .setContentText("Kiruvchi qo‘ng‘iroqlar serverga avtomatik uzatilmoqda")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "CallSend Gateway Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Fon xizmati qo‘ng‘iroqlarni kuzatadi"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
