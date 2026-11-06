package com.dawrialhikma.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    static final String HOME = "https://dawri-alhikma.web.app/";
    static final String OFFLINE = "<html dir='rtl'><body style='background:#07140d;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;text-align:center'>"
        + "<h2>ما في اتصال بالإنترنت</h2><p>تأكد من الإنترنت وجرب مرة تانية</p>"
        + "<button onclick=\"location.href='" + HOME + "'\" style='font-size:18px;padding:10px 24px;border-radius:10px;border:0;background:#f0b43a'>إعادة المحاولة</button></body></html>";
    WebView web;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setUserAgentString(s.getUserAgentString() + " DawriAlhikmaApp");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String u = r.getUrl().toString();
                if (u.startsWith(HOME)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(u))); } catch (Exception e) { }
                return true;
            }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadDataWithBaseURL(HOME, OFFLINE, "text/html", "utf-8", null);
            }
        });
        if (b != null) web.restoreState(b); else web.loadUrl(HOME);
    }

    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }

    @Override
    public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
