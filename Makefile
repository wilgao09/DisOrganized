
ifeq ($(OS), Windows_NT)
	detected_OS := windows 
else
	detected_OS := $(shell sh -c 'uname 2>/dev/null || echo Unknown')
	echo "unsupported OS: $(detected_OS)"
	exit
endif


build_windows: build.py
	python build.py


build: clean
	# cd server && go mod tidy && go build -o ../client/rsrc/server.exe
	# cd svelte && npm run build && xcopy /q /E /y /i build ..\client\\rsrc\\svelte
	cd server && make build
	cp server/server.exe client/rsrc/server.exe

	cd svelte && make build
	cp svelte/build client/rsrc/svelte

	cp client build
	cd build && tsc && cd src && rm -r *.ts && rm -r *.tsx
	cd build  &&  npm run make

clean:
	rm -rfv build 