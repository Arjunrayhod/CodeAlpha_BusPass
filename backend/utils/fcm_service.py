import os
import json
import logging
import sqlite3

logger = logging.getLogger(__name__)

_firebase_initialized = False

def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials

        if len(firebase_admin._apps) > 0:
            _firebase_initialized = True
            return True

        # Check for service account credentials in environment or file
        cred_env = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
        cred_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'firebase-credentials.json')

        if cred_env:
            try:
                # If JSON string
                if cred_env.strip().startswith('{'):
                    cred_dict = json.loads(cred_env)
                    cred = credentials.Certificate(cred_dict)
                else:
                    # File path
                    cred = credentials.Certificate(cred_env)
                firebase_admin.initialize_app(cred)
                _firebase_initialized = True
                logger.info("[FCM] Firebase Admin initialized from environment variable.")
                return True
            except Exception as e:
                logger.error(f"[FCM] Failed to initialize from FIREBASE_SERVICE_ACCOUNT_KEY: {e}")

        if os.path.exists(cred_file):
            try:
                cred = credentials.Certificate(cred_file)
                firebase_admin.initialize_app(cred)
                _firebase_initialized = True
                logger.info(f"[FCM] Firebase Admin initialized from {cred_file}")
                return True
            except Exception as e:
                logger.error(f"[FCM] Failed to initialize from {cred_file}: {e}")

        # Fallback to default application credentials if running in GCP / Firebase environment
        try:
            firebase_admin.initialize_app()
            _firebase_initialized = True
            logger.info("[FCM] Firebase Admin initialized with default credentials.")
            return True
        except Exception as e:
            logger.warning(f"[FCM] Firebase Admin credentials not found: {e}. Push notifications will log payloads.")
            return False

    except ImportError:
        logger.warning("[FCM] firebase_admin python package is not installed. Run: pip install firebase-admin")
        return False


def register_admin_fcm_token(db_connection_fn, user_id, fcm_token, device_name="Android Device"):
    """
    Saves or updates an FCM token for an admin user.
    """
    if not user_id or not fcm_token:
        return False

    conn = db_connection_fn()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO admin_fcm_tokens (user_id, fcm_token, device_name, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(fcm_token) DO UPDATE SET
                user_id = excluded.user_id,
                device_name = excluded.device_name,
                updated_at = CURRENT_TIMESTAMP
        ''', (user_id, fcm_token, device_name))
        conn.commit()
        logger.info(f"[FCM] Registered token for admin #{user_id} ({device_name})")
        return True
    except Exception as e:
        logger.error(f"[FCM] Failed to register token: {e}")
        return False
    finally:
        conn.close()


def unregister_admin_fcm_token(db_connection_fn, fcm_token):
    """
    Removes an FCM token from database when admin logs out.
    """
    if not fcm_token:
        return False

    conn = db_connection_fn()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM admin_fcm_tokens WHERE fcm_token = ?', (fcm_token,))
        conn.commit()
        logger.info("[FCM] Unregistered token.")
        return True
    except Exception as e:
        logger.error(f"[FCM] Failed to unregister token: {e}")
        return False
    finally:
        conn.close()


def send_admin_booking_notification(db_connection_fn, ticket_data):
    """
    Sends FCM Push Notification to all registered Admin devices when a ticket is booked.
    """
    if not ticket_data:
        return {"success": False, "error": "No ticket data provided"}

    ticket_id = ticket_data.get('id')
    passenger = ticket_data.get('user_name') or 'Passenger'
    source = ticket_data.get('source') or ''
    destination = ticket_data.get('destination') or ''
    amount_paid = str(ticket_data.get('amount_paid') or ticket_data.get('price') or '0')
    travel_date = str(ticket_data.get('travel_date') or '')
    seat_number = str(ticket_data.get('seat_number') or '')

    # Fetch all active admin tokens
    conn = db_connection_fn()
    cursor = conn.cursor()
    try:
        tokens_rows = cursor.execute('''
            SELECT aft.id, aft.fcm_token, aft.user_id, aft.device_name
            FROM admin_fcm_tokens aft
            JOIN users u ON aft.user_id = u.id
            WHERE u.role = 'admin'
        ''').fetchall()
    except Exception as e:
        logger.error(f"[FCM] Error querying admin tokens: {e}")
        conn.close()
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

    if not tokens_rows:
        logger.info(f"[FCM] No admin devices registered for notification. Booking ID: #{ticket_id}")
        return {"success": True, "sent_count": 0, "message": "No admin devices registered"}

    tokens = [row['fcm_token'] for row in tokens_rows]

    title = "🎟️ New Ticket Booking"
    formatted_id = f"#BP-{int(ticket_id):06d}" if ticket_id else "#BP-UNKNOWN"
    body = f"New booking {formatted_id} by {passenger} for {source} ➔ {destination} (₹{amount_paid})"

    data_payload = {
        "type": "NEW_BOOKING",
        "booking_id": str(ticket_id or ""),
        "passenger_name": str(passenger),
        "source": str(source),
        "destination": str(destination),
        "fare": str(amount_paid),
        "travel_date": str(travel_date),
        "seat_number": str(seat_number),
        "title": title,
        "body": body
    }

    # Initialize Firebase SDK
    has_firebase = init_firebase()

    if not has_firebase:
        logger.info(f"[FCM Mock Broadcast] To {len(tokens)} devices: Title='{title}', Body='{body}', Data={data_payload}")
        return {"success": True, "sent_count": len(tokens), "mock": True}

    try:
        from firebase_admin import messaging

        android_config = messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                channel_id='admin_booking_notifications',
                title=title,
                body=body,
                sound='default',
                click_action='OPEN_ADMIN_BOOKING',
                priority='high'
            )
        )

        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data_payload,
            android=android_config
        )

        response = messaging.send_each_for_multicast(message)
        logger.info(f"[FCM] Broadcast complete: {response.success_count} success, {response.failure_count} failures.")

        # Handle dead / invalid tokens and clean up DB
        if response.failure_count > 0:
            dead_tokens = []
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    err = resp.exception
                    # Check if token is invalid or unregistered
                    if isinstance(err, (messaging.UnregisteredError, messaging.SenderIdMismatchError)):
                        dead_tokens.append(tokens[idx])
                    else:
                        logger.warning(f"[FCM] Delivery failed to device {idx}: {err}")

            if dead_tokens:
                logger.info(f"[FCM] Cleaning up {len(dead_tokens)} invalid/stale tokens from DB.")
                cleanup_conn = db_connection_fn()
                cleanup_cursor = cleanup_conn.cursor()
                try:
                    cleanup_cursor.executemany('DELETE FROM admin_fcm_tokens WHERE fcm_token = ?', [(t,) for t in dead_tokens])
                    cleanup_conn.commit()
                except Exception as e:
                    logger.error(f"[FCM] Failed to cleanup dead tokens: {e}")
                finally:
                    cleanup_conn.close()

        return {
            "success": True,
            "sent_count": response.success_count,
            "failure_count": response.failure_count
        }

    except Exception as e:
        logger.error(f"[FCM] Error sending multicast message: {e}")
        return {"success": False, "error": str(e)}
