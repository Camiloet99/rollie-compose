package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.DocumentUploadLog;
import com.rollie.mainservice.repository.DocumentUploadLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class DocumentUploadService {

    private final DocumentUploadLogRepository logRepository;
    private final WebClient webClient;

    @Autowired
    public DocumentUploadService(
            DocumentUploadLogRepository logRepository,
            @Value("${python.service.url}") String pythonServiceUrl
    ) {
        this.logRepository = logRepository;
        this.webClient = WebClient.builder()
                .baseUrl(pythonServiceUrl)
                .build();
    }

    public Mono<List<DocumentUploadLog>> getAllUploadLogs() {
        return logRepository.findAllByOrderByUploadTimeDesc().collectList();
    }

    public Mono<Object> forwardFileToPythonBackend(FilePart filePart, LocalDate asOfDate, ZoneId zoneId) {
        String filename = sanitizeFilename(filePart.filename());
        LocalDateTime now = LocalDateTime.now(zoneId);

        return DataBufferUtils.join(filePart.content())
                .flatMap(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);

                    ByteArrayResource resource = new ByteArrayResource(bytes) {
                        @Override
                        public String getFilename() {
                            return filename;
                        }
                    };

                    MultipartBodyBuilder builder = new MultipartBodyBuilder();
                    builder.part("file", resource)
                            .filename(filename)
                            .contentType(MediaType.APPLICATION_OCTET_STREAM);
                    builder.part("asOfDate", asOfDate.toString());

                    return webClient.post()
                            .uri("/clean-watches/")
                            .contentType(MediaType.MULTIPART_FORM_DATA)
                            .body(BodyInserters.fromMultipartData(builder.build()))
                            .retrieve()
                            .bodyToMono(Object.class)
                            .flatMap(result -> {
                                DocumentUploadLog log = DocumentUploadLog.builder()
                                        .filename(filename)
                                        .uploadTime(now)
                                        .asOfDate(asOfDate) // NEW
                                        .build();
                                return logRepository.save(log).thenReturn(result);
                            });
                });
    }

    public Mono<Object> deleteDocumentAndAssociatedWatches(Long documentId) {
        return logRepository.findById(documentId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Document log not found")))
                .flatMap(log -> {
                    LocalDate asOfDate = log.getAsOfDate();

                    // 1) Borrar watches en el backend Python por asOfDate
                    return webClient.delete()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/watches/by-as-of/{asOfDate}")
                                    .build(asOfDate.toString()))
                            .retrieve()
                            .bodyToMono(Object.class)
                            // 2) Si Python responde OK, borrar el log en la BD de Java
                            .flatMap(pythonResponse ->
                                    logRepository.delete(log)
                                            .thenReturn(pythonResponse)
                            );
                });
    }

    private String sanitizeFilename(String raw) {
        String cleaned = (raw == null || raw.isBlank()) ? "upload.xlsx" : raw;
        cleaned = cleaned.replace("\\", "/");
        int slash = cleaned.lastIndexOf('/');
        if (slash >= 0) cleaned = cleaned.substring(slash + 1);
        return cleaned;
    }
}
