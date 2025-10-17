package com.rollie.mainservice.models;


import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@lombok.Data
@lombok.Builder
@AllArgsConstructor
@NoArgsConstructor
public class PageResult<T> {
    private java.util.List<T> items;
    private long total;
    private int page;
    private int size;

    public static <T> PageResult<T> of(java.util.List<T> items, long total, int page, int size) {
        return PageResult.<T>builder().items(items).total(total).page(page).size(size).build();
    }
}
