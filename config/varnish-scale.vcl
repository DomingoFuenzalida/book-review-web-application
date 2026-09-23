vcl 4.0;
import directors;

probe api_probe {
    .url = "/";
    .timeout = 1s;
    .interval = 2s;
    .window = 3;
    .threshold = 2;
}

backend api1 { .host = "api1"; .port = "3000"; .probe = api_probe; }
backend api2 { .host = "api2"; .port = "3000"; .probe = api_probe; }
backend api3 { .host = "api3"; .port = "3000"; .probe = api_probe; }
backend staticserver { .host = "static"; .port = "80"; }

sub vcl_init {
    new vdir = directors.round_robin();
    vdir.add_backend(api1);
    vdir.add_backend(api2);
    vdir.add_backend(api3);
}

sub vcl_recv {
    if (req.url ~ "^/api/") {
        set req.backend_hint = vdir.backend();
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
