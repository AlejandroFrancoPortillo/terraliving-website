import http.server, socketserver, os

os.chdir("/Users/afranco/Documents/terraliving-website")
PORT = 3456
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), handler) as httpd:
    httpd.serve_forever()
