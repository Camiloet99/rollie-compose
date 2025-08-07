package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.TierEntity;
import com.rollie.mainservice.repository.TierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TierService {

    private final TierRepository tierRepository;

    public Mono<TierEntity> getTierById(Integer tierId){
        return tierRepository.findById(tierId.longValue());
    }

    public Mono<TierEntity> createTier(TierEntity tier) {
        log.info("Creating tier... " + tier.toString());
        return tierRepository.save(tier);
    }

    public Mono<List<TierEntity>> getAllTiers() {
        return tierRepository.findAll()
                .collectList()
                .flatMap(tiers -> {
                    if (tiers.isEmpty()) {
                        TierEntity freeTier = TierEntity.builder()
                                .name("FREE")
                                .description("Free default tier")
                                .active(true)
                                .price(0f)
                                .searchLimit(2)
                                .priceDropNotification(false)
                                .searchHistoryLimit(1)
                                .priceFluctuationGraph(false)
                                .autocompleteReference(false)
                                .advancedSearch(false)
                                .extraProperties("")
                                .build();

                        return tierRepository.save(freeTier)
                                .then(tierRepository.findAll().collectList());
                    } else {
                        return Mono.just(tiers);
                    }
                });
    }

    public Mono<TierEntity> updateTier(Long id, TierEntity updated) {
        return tierRepository.findById(id)
                .flatMap(existing -> {
                    existing.setName(updated.getName());
                    existing.setDescription(updated.getDescription());
                    existing.setActive(updated.getActive());
                    existing.setPrice(updated.getPrice());

                    // Propiedades específicas
                    existing.setSearchLimit(updated.getSearchLimit());
                    existing.setPriceDropNotification(updated.getPriceDropNotification());
                    existing.setSearchHistoryLimit(updated.getSearchHistoryLimit());
                    existing.setPriceFluctuationGraph(updated.getPriceFluctuationGraph());
                    existing.setAutocompleteReference(updated.getAutocompleteReference());
                    existing.setAdvancedSearch(updated.getAdvancedSearch());

                    // Propiedades extra
                    existing.setExtraProperties(updated.getExtraProperties());

                    return tierRepository.save(existing);
                });
    }


    public Mono<Void> deleteTier(Long id) {
        return tierRepository.deleteById(id);
    }

    public Mono<TierEntity> deactivateTier(Long id) {
        return tierRepository.findById(id)
                .flatMap(tier -> {
                    tier.setActive(false);
                    return tierRepository.save(tier);
                });
    }

    public Mono<TierEntity> activateTier(Long id) {
        return tierRepository.findById(id)
                .flatMap(tier -> {
                    tier.setActive(true);
                    return tierRepository.save(tier);
                });
    }
}
