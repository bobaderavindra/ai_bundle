package com.investai.portfolio.events;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(classes = PortfolioKafkaIntegrationTest.KafkaTestConfig.class)
@EmbeddedKafka(partitions = 1, topics = {"portfolio.trade.executed"})
@DirtiesContext
class PortfolioKafkaIntegrationTest {

    @org.springframework.beans.factory.annotation.Autowired
    private TradeEventPublisher publisher;

    @org.springframework.beans.factory.annotation.Autowired
    private TradeEventConsumer consumer;

    @Test
    void shouldPublishAndConsumeTradeEvent() throws Exception {
        TradeExecutedEvent event = new TradeExecutedEvent(
                "trade-1",
                "user-1",
                "portfolio-1",
                "AAPL",
                "BUY",
                new BigDecimal("10"),
                new BigDecimal("182.50"),
                LocalDateTime.now()
        );

        publisher.publish(event);

        long deadline = System.currentTimeMillis() + Duration.ofSeconds(8).toMillis();
        while (System.currentTimeMillis() < deadline) {
            List<TradeExecutedEvent> events = consumer.getRecentEvents();
            if (events.stream().anyMatch(e -> "trade-1".equals(e.tradeId()))) {
                return;
            }
            Thread.sleep(100);
        }

        assertTrue(
                consumer.getRecentEvents().stream().anyMatch(e -> "trade-1".equals(e.tradeId())),
                "Expected consumer to receive published trade event"
        );
    }

    @Configuration
    @EnableKafka
    static class KafkaTestConfig {
        @Bean
        ProducerFactory<String, TradeExecutedEvent> producerFactory(EmbeddedKafkaBroker broker) {
            Map<String, Object> props = new HashMap<>();
            props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, broker.getBrokersAsString());
            props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
            props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
            props.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
            return new DefaultKafkaProducerFactory<>(props);
        }

        @Bean
        ConsumerFactory<String, TradeExecutedEvent> consumerFactory(EmbeddedKafkaBroker broker) {
            Map<String, Object> props = new HashMap<>();
            props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, broker.getBrokersAsString());
            props.put(ConsumerConfig.GROUP_ID_CONFIG, "portfolio-kafka-test-group");
            props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
            props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
            props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
            props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.investai.portfolio.events");
            props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, TradeExecutedEvent.class.getName());
            return new DefaultKafkaConsumerFactory<>(props);
        }

        @Bean
        ConcurrentKafkaListenerContainerFactory<String, TradeExecutedEvent> kafkaListenerContainerFactory(
                ConsumerFactory<String, TradeExecutedEvent> consumerFactory
        ) {
            ConcurrentKafkaListenerContainerFactory<String, TradeExecutedEvent> factory =
                    new ConcurrentKafkaListenerContainerFactory<>();
            factory.setConsumerFactory(consumerFactory);
            return factory;
        }

        @Bean
        KafkaTemplate<String, TradeExecutedEvent> kafkaTemplate(
                ProducerFactory<String, TradeExecutedEvent> producerFactory
        ) {
            return new KafkaTemplate<>(producerFactory);
        }

        @Bean
        TradeEventPublisher tradeEventPublisher(KafkaTemplate<String, TradeExecutedEvent> kafkaTemplate) {
            return new TradeEventPublisher(kafkaTemplate, "portfolio.trade.executed");
        }

        @Bean
        TradeEventConsumer tradeEventConsumer() {
            return new TradeEventConsumer();
        }
    }
}

