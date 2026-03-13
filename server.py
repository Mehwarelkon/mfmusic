# from http.server import HTTPServer, SimpleHTTPRequestHandler
# from urllib.parse import urlparse
# import os
# import json

# PORT = 8000
# WEB_DIR = os.path.dirname(__file__)

# class MyHandler(SimpleHTTPRequestHandler):
#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, directory=WEB_DIR, **kwargs)

#     def do_GET(self):
#         parsed_path = urlparse(self.path)

#         # API route callable from JS
#         if parsed_path.path == '/api/hello':
#             self.api_hello()
#         elif parsed_path.path=='/api/fa':
#             self.api_fa()
#         elif parsed_path.path=='/api/mfmusic':
#             self.get_mfmusicDir("./mfmusic")
#         else:
#             super().do_GET()  # serve static files

#     def api_hello(self):
#         response = {
#             "message": "Hello from Python function!"
#         }
#         self.send_response(200)
#         self.send_header('Content-type', 'application/json')
#         self.send_header('Access-Control-Allow-Origin', '*')  # allow JS from any origin
#         self.end_headers()
#         self.wfile.write(json.dumps(response).encode())
#     def api_fa(self):
#         self.send_response(200)
#         self.send_header('Content-type','application/json')
#         self.send_header('Access-Control-Allow-Origin','*')
#         self.end_headers()
#         self.wfile.write(json.dumps({"val":"FA"}).encode())
#     def get_mfmusicDir(self,_dir):
#         self.send_response(200)
#         self.send_header('Content-type','application/json')
#         self.send_header('Access-Control-Allow-Origin','*')
#         self.end_headers()
#         arr:list=os.listdir(_dir)
#         self.wfile.write(json.dumps({"val":arr}).encode())
        


# server = HTTPServer(('0.0.0.0', PORT), MyHandler)
# print(f"Serving folder '{WEB_DIR}' at http://localhost:{PORT}")
# server.serve_forever()

from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse,parse_qs
import os
import json

PORT = 8000
WEB_DIR = os.path.dirname(__file__)

class MyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        parsed_path = urlparse(self.path)

        # API routes
        if parsed_path.path == '/api/hello':
            self.api_hello()
        elif parsed_path.path == '/api/fa':
            self.api_fa()
        elif parsed_path.path == '/api/mfmusic':
            params = parse_qs(parsed_path.query)
            _dir = params.get("dir", ["./"])[0]
            if(_dir[0]=='/'):
                _dir=_dir[1:]
            print(f"\n\njoined is    {os.path.join("./mfmusic",_dir)}\n\n")
            self.get_mfmusicDir(os.path.join("mfmusic",_dir))
        elif parsed_path.path =='/api/mfmusicParent':
            params = parse_qs(parsed_path.query)
            _dir = params.get("dir", ["./"])[0]
            if(_dir[0]=='/'):
                _dir=_dir[1:]
            print(f"\n\njoined is    {os.path.join("./mfmusic",_dir)}\n\n")
            self.mfmusicParent(os.path.join("mfmusic",_dir))
        else:
            super().do_GET()  # serve static files

    # Minimal API example
    def api_hello(self):
        response = {"message": "Hello from Python function!"}
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def api_fa(self):
        self.send_response(200)
        self.send_header('Content-type','application/json')
        self.send_header('Access-Control-Allow-Origin','*')
        self.end_headers()
        self.wfile.write(json.dumps({"val":"FA"}).encode())

    # Returns list of music files
    def get_mfmusicDir(self,_dir):
        print(f"recived  {_dir} ")
        _dir=os.path.normpath(_dir)
        print(f"translated  {_dir}")
        self.send_response(200)
        self.send_header('Content-type','application/json')
        self.send_header('Access-Control-Allow-Origin','*')
        self.end_headers()
        arr=[]
        print(f" \n\n          #  {_dir}  #         \n\n ")

        for fileName in os.listdir(_dir):
            arr.append({"name":fileName,"isFile":os.path.isfile(os.path.join(_dir,fileName))})
        
        self.wfile.write(json.dumps({"val":arr,"current":_dir}).encode())

    # Override send_head to support Range requests for audio
    def mfmusicParent(self,_dir):
        _dir=os.path.normpath(_dir)
        print(f"before check  {_dir}")
        if(_dir!='mfmusic'):
            _dir=os.path.dirname(_dir)
        print(f'js recives ??  {_dir}')
        self.get_mfmusicDir(_dir)
    def send_head(self):
        path = self.translate_path(self.path)
        if path.endswith((".mp3", ".ogg", ".wav")) and os.path.exists(path):
            f = open(path, 'rb')
            fs = os.fstat(f.fileno())
            size = fs.st_size

            range_header = self.headers.get('Range', None)
            if range_header:
                # parse Range header
                start = int(range_header.replace('bytes=', '').split('-')[0])
                self.send_response(206)
                self.send_header("Content-type", "audio/mpeg")
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Content-Range", f"bytes {start}-{size-1}/{size}")
                self.send_header("Content-Length", str(size - start))
                self.end_headers()
                f.seek(start)
                return f

            # full file
            self.send_response(200)
            self.send_header("Content-type", "audio/mpeg")
            self.send_header("Content-Length", str(size))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            return f
        else:
            return super().send_head()

# Start server
server = HTTPServer(('0.0.0.0', PORT), MyHandler)
print(f"Serving folder '{WEB_DIR}' at http://localhost:{PORT}")
server.serve_forever()