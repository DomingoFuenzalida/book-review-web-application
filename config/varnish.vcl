vcl 4.0;

probe api_probe {
    .url = "/";
    .timeout = 1s;
    .interval = 2s;
    .window = 3;
    .threshold = 2;
}

backend api { .host = "api"; .port = "3000"; .probe = api_probe; }
backend staticserver { .host = "static"; .port = "80"; }

sub vcl_recv {
    if (req.url ~ "^/api/") {
        set req.backend_hint = api;
        return (pass);
    }

    # Everything else goes to the static server and is cached
    set req.backend_hint = staticserver;
    unset req.http.Cookie;
    return (hash);
}

sub vcl_backend_response {
    if (bereq.url !~ "^/api/") {
        set beresp.ttl = 1h;
        unset beresp.http.Set-Cookie;
    }
}
