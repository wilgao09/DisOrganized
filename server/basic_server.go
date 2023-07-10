package main

import (
	"C"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"os"
	"path"

	"time"

	"williamgao09/disorganized/db"
	ipcutil "williamgao09/disorganized/ipc"
	wsutil "williamgao09/disorganized/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)
import "net/url"

const portno = 11326

// NewProxy takes target host and creates a reverse proxy
func NewProxy(targetHost string) (*httputil.ReverseProxy, error) {
	url, err := url.Parse(targetHost)
	if err != nil {
		return nil, err
	}

	return httputil.NewSingleHostReverseProxy(url), nil
}

// ProxyRequestHandler handles the http request using proxy
func ProxyRequestHandler(proxy *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy.ServeHTTP(w, r)
	}
}

func main() {
	// log file location
	f, err := os.OpenFile("server_log.txt", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	defer f.Close()

	log.SetOutput(f)

	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("cannot read user home")
	}
	ipcutil.SetCurrentWorkingDirectory(home + "/DisOrganized/boards")
	ipcutil.SetCurrentPluginDirectory(home + "/DisOrganized/plugins")

	log.Printf("Plugins directory is set to %s\n", ipcutil.GetPluginsDirectory())

	// fmt.Printf("hello world\n")

	// err := dbutil.Init("../../..")
	// if err != nil {
	// 	log.Fatal("Failed to initialize the boards directory")
	// }

	// err := dbutil.Create_db_file("kiki")
	// if !err {
	// 	log.Fatal(err)
	// } else {
	// 	fmt.Println("found")
	// }
	// db, e := dbutil.Init_struct("kiki")
	// if e != nil {
	// 	log.Fatal(e)
	// } else {
	// 	fmt.Println("db struct initted")
	// }
	// b := db.AddObject("{\"x\": 100, \"y\":100, \"w\":100, \"h\": 100}")
	// if !b {
	// 	fmt.Println("failed to add object")
	// }

	// db.ApplyDiff(dbutil.DbDiff{
	// 	Dtype:   dbutil.DT_UPDATE,
	// 	Id:      2,
	// 	Content: "{\"x\": 5000, \"y\": 6000}",
	// })

	// fmt.Println(db.GetObjects())

	// initialize ws stuff
	wsutil.Init()
	setUpWSHandlers()
	os.MkdirAll(ipcutil.GetPluginsDirectory(), os.ModePerm)

	log.Println("starting server")
	gin.SetMode(gin.ReleaseMode)
	gin.DefaultWriter = ioutil.Discard

	server := gin.Default()

	server.Use(cors.New(cors.Config{
		// AllowOrigins:  []string{"*"}, // TODO: can we do better?
		AllowMethods:     []string{"GET"},
		AllowHeaders:     []string{"Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {

			return origin != "ALLOW_ALL_ORIGINS"
		},
		MaxAge: 12 * time.Hour,
	}))

	server.GET("/helloworld", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"msg": "HELLO WORLD",
		})
	})

	server.GET("/connectws/:name", func(ctx *gin.Context) {

		log.Println("Requesting permission from admin . . .")
		if db.HasOpenBoard() && ipcutil.NewConnectionRequest(ctx.Param("name"), getRequestIP(ctx.Request)) {

			wsutil.EstablishConnection(ctx.Writer, ctx.Request, ctx.Param("name"))
		} else {
			// TODO: this doesnt tell the client anything because websocket connection fails
			// were designed to fail silently for security reasons
			// FIX THIS by connecting and sending the failure reason and closing up
			ctx.JSON(403, gin.H{
				"msg": "Admin refused",
			})
		}
	})

	// TODO: add security
	// server.StaticFS("/plugins", http.Dir(ipcutil.GetPluginsDirectory()))
	server.GET("/plugins/:name", func(ctx *gin.Context) {
		if path.Ext(ctx.Request.URL.Path) != ".js" {
			ctx.Writer.WriteHeader(http.StatusNotFound)
			ctx.Writer.Write([]byte{})
			return
		}
		data, err := os.ReadFile(fmt.Sprintf("%s/%s", ipcutil.GetPluginsDirectory(), ctx.Param("name")))
		if err != nil {
			ctx.Writer.WriteHeader(http.StatusNotFound)
			ctx.Writer.Write([]byte{})
			return
		}
		ctx.Header("Content-Type", "application/javascript")
		ctx.Writer.Write(data)

	})
	server.GET("/config", func(ctx *gin.Context) {
		returnData := *(db.GetCurrentOpenBoard().GetConfig())
		ctx.JSON(200, returnData)
	})

	server.GET("/canvas", func(ctx *gin.Context) {
		// check that this request has an associated cookie
		// cookie, err := ctx.Cookie("isAccepted")
		// log.Printf("User with cookie %s is requesting for canvas\n", cookie)
		// if err != nil && wsutil.GetConnectionsStruct().UserDataOfCookie(cookie) == nil {
		// 	log.Printf("User with cookie %s was rejected\n", cookie)
		// 	ctx.JSON(403, nil)
		// 	return
		// }
		// log.Printf("User with cookie %s was allowed\n", cookie)
		// ask admin for current board state
		var b = ipcutil.GetCanvas()
		// send
		ctx.JSON(200, b)
	})

	// reverse proxy all other paths
	proxy, err := NewProxy("http://localhost:11723")
	if err != nil {
		panic(err)
	}
	server.NoRoute(func(ctx *gin.Context) {
		ProxyRequestHandler(proxy)(ctx.Writer, ctx.Request)
	})

	log.Printf("Spawning stdio listeners\n")
	go ipcutil.IpcListen()

	log.Printf("server running on %d\n", portno)
	// server.RunTLS(fmt.Sprintf(":%d", portno), "cert.pem", "key.pem")
	server.Run(fmt.Sprintf(":%d", portno))
	log.Println("server died!")
}

func getRequestIP(req *http.Request) string {
	clientIp := req.Header.Get("X-FORWARDED-FOR")
	if clientIp != "" {
		return clientIp
	}
	return req.RemoteAddr
}
