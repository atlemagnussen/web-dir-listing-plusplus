# web directory listing++

<a href="https://raw.githubusercontent.com/atlemagnussen/web-dir-listing-plusplus/main/webdirlistingplusplus.png">
<img src="https://raw.githubusercontent.com/atlemagnussen/web-dir-listing-plusplus/main/webdirlistingplusplus.png" alt="Screenshot of web-dir-listing-plusplus" width="400"/>
</a>  

Simple directory and files listing app for web.  
One or more folders can be configured to be displayed at top level and then navigated like a file system  

plus some more:

- files are displayed with a download link and some info
- folders have a navigation link and a download all content as a zip link (be patient when you click it)
- An audio player to listen to audio files directly  

Usecase could be to make files available for download and distribution on your internal network.  
There is currently no authentication so use with care

Clone this repo and read on on how to use it:

## Dependencies

[nodejs](https://nodejs.org) minimum version 16  
which in turn means it works on Linux, Windows and MacOS

## Config

create a file `.env.prod` in root folder like example below  
`LIBTPATHS` is a flattened json
```
TITLE=my lib
PORT=8000
LIBPATHS={"Audio": "/some/path/audio","Books": "/some/path/books"}
```
 
paths containing backslashes must be escaped, ie `C:\\path`

## run

still from root folder of this repo:
```sh
npm i
npm run prod
```

## Container

[Builds on docker hub](https://hub.docker.com/repository/docker/atlmag)

```sh
# build
docker build --label web-dir-listing --tag web-dir-listing .

#!/usr/bin/env bash
# create volume for binding
docker volume create \
--opt type=none \
--opt device=/mnt/some/folder/on/host \
--opt o=bind \
datavolume

# run - LIBPATHS in .env file must be relative to /data
docker run --env-file .env.prod -v datavolume:/data:ro  -d --rm -p 8000:5000 --name web-dir-listing web-dir-listing
```

enter shell
```sh
docker exec -it web-dir-listing sh
```

## thanks to
- [Style input range](https://www.cssportal.com/style-input-range/)

