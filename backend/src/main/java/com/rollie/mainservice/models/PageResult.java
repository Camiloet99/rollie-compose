package com.rollie.mainservice.models;

import java.util.List;

public class PageResult<T> {
    private final List<T> items;
    private final long total;
    private final int page;
    private final int size;
    private final int pages;
    private final boolean hasNext;
    private final boolean hasPrev;

    public PageResult(List<T> items, long total, int page, int size, int pages, boolean hasNext, boolean hasPrev) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.size = size;
        this.pages = pages;
        this.hasNext = hasNext;
        this.hasPrev = hasPrev;
    }

    public static <T> PageResult<T> of(List<T> items, long total, int page, int size) {
        int pages = (int) Math.max(1, Math.ceil(total / (double) size));
        boolean hasNext = page + 1 < pages;
        boolean hasPrev = page > 0;
        return new PageResult<>(items, total, page, size, pages, hasNext, hasPrev);
    }

    public List<T> getItems() { return items; }
    public long getTotal() { return total; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public int getPages() { return pages; }
    public boolean isHasNext() { return hasNext; }
    public boolean isHasPrev() { return hasPrev; }
}
