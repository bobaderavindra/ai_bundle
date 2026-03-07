package com.investai.portfolio.events;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TradeEventConsumer {
    private static final Logger logger = LoggerFactory.getLogger(TradeEventConsumer.class);
    private static final int MAX_EVENTS = 200;
    private final Deque<TradeExecutedEvent> recentEvents = new ArrayDeque<>();

    @KafkaListener(
            topics = "${portfolio.kafka.trade-topic:portfolio.trade.executed}",
            groupId = "${portfolio.kafka.consumer-group:portfolio-service-consumer}"
    )
    public void consume(TradeExecutedEvent event) {
        synchronized (recentEvents) {
            if (recentEvents.size() >= MAX_EVENTS) {
                recentEvents.removeFirst();
            }
            recentEvents.addLast(event);
        }
        logger.info(
                "Consumed trade event tradeId={} portfolioId={} symbol={} type={}",
                event.tradeId(),
                event.portfolioId(),
                event.symbol(),
                event.tradeType()
        );
    }

    public List<TradeExecutedEvent> getRecentEvents() {
        synchronized (recentEvents) {
            return new ArrayList<>(recentEvents);
        }
    }
}

