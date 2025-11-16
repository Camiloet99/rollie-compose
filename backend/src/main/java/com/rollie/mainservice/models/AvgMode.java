package com.rollie.mainservice.models;

public enum AvgMode {
    ALL, LOW, MID, HIGH;

    public static AvgMode from(String s) {
        if (s == null) return ALL;
        switch (s.toLowerCase()) {
            case "low":  return LOW;
            case "mid":  return MID;
            case "high": return HIGH;
            default:     return ALL;
        }
    }
}
