package com.investai.portfolio.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class TradeEventPublisher {
    private static final Logger logger = LoggerFactory.getLogger(TradeEventPublisher.class);

    private final KafkaTemplate<String, TradeExecutedEvent> kafkaTemplate;
    private final String topic;

    public TradeEventPublisher(
            KafkaTemplate<String, TradeExecutedEvent> kafkaTemplate,
            @Value("${portfolio.kafka.trade-topic:portfolio.trade.executed}") String topic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void publish(TradeExecutedEvent event) {
        kafkaTemplate.send(topic, event.portfolioId(), event)
                .whenComplete((result, throwable) -> {
                    if (throwable != null) {
                        logger.warn("Trade event publish failed for tradeId={}", event.tradeId(), throwable);
                    } else {
                        logger.info("Trade event published tradeId={} topic={}", event.tradeId(), topic);
                    }
                });
    }
}
