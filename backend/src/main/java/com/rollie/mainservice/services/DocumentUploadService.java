package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.DocumentUploadLog;
import com.rollie.mainservice.repository.DocumentUploadLogRepository;
import lombok.RequiredArgsConstructor;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentUploadService {

    private final DocumentUploadLogRepository logRepository;

    private final WebClient webClient;

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
        return logRepository.findAll().collectList();
    }

    public Mono<Object> forwardFileToPythonBackend(FilePart filePart) {
        String filename = filePart.filename();
        LocalDateTime now = LocalDateTime.now();

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
                            .header("Content-Disposition",
                                    "form-data; name=file; filename=" + filename);

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
                                        .build();
                                return logRepository.save(log).thenReturn(result);
                            });
                });
    }
}
