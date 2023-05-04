# web directory listing++

<a href="https://raw.githubusercontent.com/atlemagnussen/web-dir-listing-plusplus/main/webdirlistingplusplus.png">
<img src="https://raw.githubusercontent.com/atlemagnussen/web-dir-listing-plusplus/main/webdirlistingplusplus.png" alt="Screenshot of web-dir-listing-plusplus" width="400"/>
</a>  

A nodejs express app that traverses one or more lib folders and presents them ala directory listing + some more

- files are displayed with a download link and some info
- folders with a normal navigation link and download as a zip link
- Also an audio player for audio files to listen to them directly  

## Dependencies

[nodejs](https://nodejs.org) minimum version 16

## Config

create a file `.env.prod` in server folder like example below  
`LIBTPATHS` is a flattened json
```
TITLE=my lib
PORT=8000
LIBPATHS={"Audio": "/some/path/audio","Books": "/some/path/books"}
```
 
paths containing backslashes must be escaped, ie `C:\\path`

## run

from this root folder
```sh
npm i
npm run prod
```

## debug

### web client
```sh
cd web
npm start
```

## thanks to
- [Style input range](https://www.cssportal.com/style-input-range/)