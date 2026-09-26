package com.creatoraistudio.app;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ProgressBar progressBar;

    // TODO: After deploying Next.js, set this to your live URL and rebuild
    // Example: "https://creatorai.yourdomain.com"
    // For emulator local: "http://10.0.2.2:3000"
    private static final String APP_URL = null;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        if (APP_URL != null && !APP_URL.isEmpty()) {
            webView.loadUrl(APP_URL);
        } else {
            String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<style>body{font-family:system-ui,sans-serif;padding:28px;background:#f8fafc;color:#0f172a;text-align:center}"
                + "h1{color:#2563eb;margin-top:48px;font-size:1.6rem}p{color:#64748b;line-height:1.55;max-width:320px;margin:12px auto}"
                + "code{background:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:0.85rem}</style></head><body>"
                + "<h1>CreatorAI Studio</h1>"
                + "<p>Android shell is ready.</p>"
                + "<p>Deploy the Next.js web app, then set <code>APP_URL</code> in MainActivity.java to your domain and rebuild this APK.</p>"
                + "<p style='margin-top:36px;font-size:12px;color:#94a3b8'>com.creatoraistudio.app · v1.0.0</p>"
                + "</body></html>";
            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
