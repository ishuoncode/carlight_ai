package com.carlight.demo.util;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.Locale;

public class InvoiceUtil {

    private InvoiceUtil() {}

    public static String generateInvoiceNo(Long outletId) {

        // month like JAN, FEB, MAR...
        String month = LocalDateTime.now()
                .getMonth()
                .getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                .toUpperCase();

        long millis = System.currentTimeMillis();

        return "CW-" + outletId + "-" + month + "-" + millis;
    }
}
