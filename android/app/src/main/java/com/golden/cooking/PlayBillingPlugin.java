package com.golden.cooking;

import androidx.annotation.NonNull;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONException;

/**
 * Google Play Billing for Golden's subscriptions (Billing Library 7). The web app (running in the
 * Capacitor WebView) calls getProducts → purchase → sends the purchase token to the server, which
 * verifies it with the Google Play Developer API and acknowledges it. Nothing is granted here.
 *
 * JS side: src/lib/native/play-billing.ts.
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private final Map<String, ProductDetails> productCache = new HashMap<>();
    private PluginCall pendingPurchase;
    private final List<Runnable> waitingForConnection = new ArrayList<>();
    private boolean connecting = false;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build();
    }

    /** Runs the task once the billing service is connected, connecting first if needed. */
    private void whenReady(PluginCall call, Runnable task) {
        if (billingClient.isReady()) {
            task.run();
            return;
        }
        waitingForConnection.add(task);
        if (connecting) return;
        connecting = true;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                connecting = false;
                List<Runnable> tasks = new ArrayList<>(waitingForConnection);
                waitingForConnection.clear();
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (Runnable t : tasks) t.run();
                } else {
                    call.reject("Google Play Billing is unavailable: " + result.getDebugMessage(), codeName(result.getResponseCode()));
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                connecting = false;
            }
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        JSArray ids = call.getArray("productIds");
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        try {
            for (String id : ids.<String>toList()) {
                products.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.SUBS).build());
            }
        } catch (JSONException | NullPointerException e) {
            call.reject("productIds must be a list of strings", "BAD_ARGUMENTS");
            return;
        }
        if (products.isEmpty()) {
            call.reject("productIds must not be empty", "BAD_ARGUMENTS");
            return;
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(products).build();
        whenReady(call, () -> billingClient.queryProductDetailsAsync(params, (result, detailsList) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject(result.getDebugMessage(), codeName(result.getResponseCode()));
                return;
            }
            JSArray out = new JSArray();
            for (ProductDetails details : detailsList) {
                productCache.put(details.getProductId(), details);
                out.put(productJson(details));
            }
            JSObject ret = new JSObject();
            ret.put("products", out);
            call.resolve(ret);
        }));
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        String offerToken = call.getString("offerToken");
        String accountId = call.getString("accountId");
        ProductDetails details = productId == null ? null : productCache.get(productId);
        if (details == null || offerToken == null) {
            call.reject("Load products with getProducts before purchasing", "BAD_ARGUMENTS");
            return;
        }
        if (pendingPurchase != null) {
            call.reject("A purchase is already in progress", "BUSY");
            return;
        }
        BillingFlowParams.ProductDetailsParams productParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(details)
            .setOfferToken(offerToken)
            .build();
        BillingFlowParams.Builder flow = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(productParams));
        // Ties the purchase to the Golden account so the server can check who it belongs to.
        if (accountId != null && !accountId.isEmpty()) flow.setObfuscatedAccountId(accountId);

        whenReady(call, () -> getActivity().runOnUiThread(() -> {
            pendingPurchase = call;
            BillingResult result = billingClient.launchBillingFlow(getActivity(), flow.build());
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                pendingPurchase = null;
                call.reject(result.getDebugMessage(), codeName(result.getResponseCode()));
            }
        }));
    }

    @PluginMethod
    public void getPurchases(PluginCall call) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build();
        whenReady(call, () -> billingClient.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject(result.getDebugMessage(), codeName(result.getResponseCode()));
                return;
            }
            JSArray out = new JSArray();
            for (Purchase p : purchases) out.put(purchaseJson(p));
            JSObject ret = new JSObject();
            ret.put("purchases", out);
            call.resolve(ret);
        }));
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult result, List<Purchase> purchases) {
        PluginCall call = pendingPurchase;
        pendingPurchase = null;
        if (call == null) return;
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null && !purchases.isEmpty()) {
            call.resolve(purchaseJson(purchases.get(0)));
        } else {
            call.reject(code == BillingClient.BillingResponseCode.USER_CANCELED ? "Purchase cancelled" : result.getDebugMessage(), codeName(code));
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null) billingClient.endConnection();
    }

    private static JSObject productJson(ProductDetails details) {
        JSObject product = new JSObject();
        product.put("productId", details.getProductId());
        product.put("title", details.getTitle());
        JSArray offers = new JSArray();
        List<ProductDetails.SubscriptionOfferDetails> offerList = details.getSubscriptionOfferDetails();
        if (offerList != null) {
            for (ProductDetails.SubscriptionOfferDetails offer : offerList) {
                JSObject o = new JSObject();
                o.put("basePlanId", offer.getBasePlanId());
                o.put("offerId", offer.getOfferId());
                o.put("offerToken", offer.getOfferToken());
                JSArray phases = new JSArray();
                for (ProductDetails.PricingPhase phase : offer.getPricingPhases().getPricingPhaseList()) {
                    JSObject ph = new JSObject();
                    ph.put("formattedPrice", phase.getFormattedPrice());
                    ph.put("priceAmountMicros", phase.getPriceAmountMicros());
                    ph.put("priceCurrencyCode", phase.getPriceCurrencyCode());
                    ph.put("billingPeriod", phase.getBillingPeriod());
                    ph.put("recurrenceMode", phase.getRecurrenceMode());
                    ph.put("billingCycleCount", phase.getBillingCycleCount());
                    phases.put(ph);
                }
                o.put("phases", phases);
                offers.put(o);
            }
        }
        product.put("offers", offers);
        return product;
    }

    private static JSObject purchaseJson(Purchase p) {
        JSObject o = new JSObject();
        o.put("purchaseToken", p.getPurchaseToken());
        o.put("products", new JSArray(p.getProducts()));
        o.put("orderId", p.getOrderId());
        o.put("purchaseState", p.getPurchaseState());
        o.put("acknowledged", p.isAcknowledged());
        return o;
    }

    private static String codeName(int code) {
        switch (code) {
            case BillingClient.BillingResponseCode.USER_CANCELED: return "USER_CANCELED";
            case BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED: return "ITEM_ALREADY_OWNED";
            case BillingClient.BillingResponseCode.ITEM_UNAVAILABLE: return "ITEM_UNAVAILABLE";
            case BillingClient.BillingResponseCode.BILLING_UNAVAILABLE: return "BILLING_UNAVAILABLE";
            case BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE: return "SERVICE_UNAVAILABLE";
            case BillingClient.BillingResponseCode.SERVICE_DISCONNECTED: return "SERVICE_DISCONNECTED";
            case BillingClient.BillingResponseCode.NETWORK_ERROR: return "NETWORK_ERROR";
            case BillingClient.BillingResponseCode.DEVELOPER_ERROR: return "DEVELOPER_ERROR";
            case BillingClient.BillingResponseCode.FEATURE_NOT_SUPPORTED: return "FEATURE_NOT_SUPPORTED";
            default: return "ERROR_" + code;
        }
    }
}
