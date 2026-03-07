import json
import logging
import os
import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any, Deque, Dict, List, Optional

from kafka import KafkaConsumer, KafkaProducer


logger = logging.getLogger("optimization.kafka")
DEFAULT_BOOTSTRAP_SERVERS = "localhost:9092"


class KafkaBus:
    def __init__(self) -> None:
        self.enabled = os.getenv("KAFKA_ENABLED", "true").lower() == "true"
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", DEFAULT_BOOTSTRAP_SERVERS)
        self.consumer_group = os.getenv("OPTIMIZATION_CONSUMER_GROUP", "optimization-service")
        self.consume_topics = _csv_topics(
            #os.getenv("OPTIMIZATION_CONSUME_TOPICS", "portfolio.trade.executed")
            os.getenv("OPTIMIZATION_CONSUME_TOPICS", "portfolio.trade.executed")
        )
        self.publish_topic = os.getenv(
            "OPTIMIZATION_EVENT_TOPIC",
            "optimization.events",
        )
        self._max_cached_events = int(os.getenv("OPTIMIZATION_EVENT_CACHE_SIZE", "200"))

        self._producer: Optional[KafkaProducer] = None
        self._consumer: Optional[KafkaConsumer] = None
        self._consumer_thread: Optional[threading.Thread] = None
        self._last_error: Optional[str] = None
        self._stop_event = threading.Event()
        self._recent_messages: Deque[Dict[str, Any]] = deque(maxlen=self._max_cached_events)
        self._lock = threading.Lock()

    def start(self) -> None:
        if not self.enabled:
            logger.info("Kafka integration disabled (KAFKA_ENABLED=false)")
            return

        self._start_producer()
        self._start_consumer_thread()

    def shutdown(self) -> None:
        self._stop_event.set()
        if self._consumer is not None:
            try:
                self._consumer.close()
            except Exception:
                logger.exception("Failed to close Kafka consumer cleanly")
        if self._consumer_thread is not None:
            self._consumer_thread.join(timeout=3)
        if self._producer is not None:
            try:
                self._producer.flush(timeout=3)
                self._producer.close()
            except Exception:
                logger.exception("Failed to close Kafka producer cleanly")

    def publish(self, event_type: str, payload: Dict[str, Any], key: Optional[str] = None) -> bool:
        if not self.enabled or self._producer is None:
            return False

        envelope = {
            "eventType": event_type,
            "service": "optimization-service",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
        encoded = json.dumps(envelope).encode("utf-8")
        try:
            future = self._producer.send(
                self.publish_topic,
                key=(key.encode("utf-8") if key else None),
                value=encoded,
            )
            future.get(timeout=3)
            return True
        except Exception:
            logger.exception("Failed to publish Kafka event to topic=%s", self.publish_topic)
            return False

    def recent_messages(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._recent_messages)

    def status(self) -> Dict[str, Any]:
        warnings: List[str] = []
        if self.enabled and self._producer is None and self._last_error:
            warnings.append(
                "Kafka is enabled but broker is unreachable. Check KAFKA_BOOTSTRAP_SERVERS "
                "(local Kafka often localhost:9092; docker-compose internal network usually kafka:9092)."
            )
        return {
            "enabled": self.enabled,
            "bootstrapServers": self.bootstrap_servers,
            "publishTopic": self.publish_topic,
            "consumeTopics": self.consume_topics,
            "consumerGroup": self.consumer_group,
            "producerConnected": self._producer is not None,
            "consumerRunning": self._consumer_thread is not None and self._consumer_thread.is_alive(),
            "cachedMessages": len(self._recent_messages),
            "warnings": warnings,
            "lastError": self._last_error,
        }

    def _start_producer(self) -> None:
        try:
            self._producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                acks="all",
                retries=5,
                linger_ms=10,
            )
            self._last_error = None
            logger.info("Kafka producer connected bootstrap=%s", self.bootstrap_servers)
        except Exception as ex:
            self._producer = None
            self._last_error = f"{type(ex).__name__}: {ex}"
            logger.exception(
                "Kafka producer failed to connect bootstrap=%s (local Kafka often localhost:9092; docker-compose internal network usually kafka:9092)",
                self.bootstrap_servers,
            )

    def _start_consumer_thread(self) -> None:
        if not self.consume_topics:
            logger.info("Kafka consumer not started: no consume topics configured")
            return
        self._consumer_thread = threading.Thread(target=self._consume_loop, daemon=True)
        self._consumer_thread.start()

    def _consume_loop(self) -> None:
        backoff_seconds = 2
        while not self._stop_event.is_set():
            try:
                self._consumer = KafkaConsumer(
                    *self.consume_topics,
                    bootstrap_servers=self.bootstrap_servers,
                    group_id=self.consumer_group,
                    enable_auto_commit=True,
                    auto_offset_reset="latest",
                    consumer_timeout_ms=1000,
                )
                logger.info(
                    "Kafka consumer started topics=%s group=%s",
                    self.consume_topics,
                    self.consumer_group,
                )

                while not self._stop_event.is_set():
                    for msg in self._consumer:
                        decoded = _decode_message(msg.value)
                        cached = {
                            "topic": msg.topic,
                            "partition": msg.partition,
                            "offset": msg.offset,
                            "key": msg.key.decode("utf-8") if msg.key else None,
                            "receivedAt": datetime.now(timezone.utc).isoformat(),
                            "value": decoded,
                        }
                        with self._lock:
                            self._recent_messages.append(cached)
            except Exception as ex:
                self._last_error = f"{type(ex).__name__}: {ex}"
                logger.exception(
                    "Kafka consumer loop failed bootstrap=%s; retrying in %ss (local Kafka often localhost:9092; docker-compose internal network usually kafka:9092)",
                    self.bootstrap_servers,
                    backoff_seconds,
                )
                time.sleep(backoff_seconds)
            finally:
                if self._consumer is not None:
                    try:
                        self._consumer.close()
                    except Exception:
                        logger.exception("Failed closing Kafka consumer")
                    self._consumer = None


def _csv_topics(raw: str) -> List[str]:
    return [topic.strip() for topic in raw.split(",") if topic.strip()]


def _decode_message(raw: bytes) -> Any:
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception:
        try:
            return raw.decode("utf-8")
        except Exception:
            return str(raw)
